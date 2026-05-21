
from collections import Counter, defaultdict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.models import (
    AnalysisRecord,
    AudioFeature,
    AudioFile,
    FeatureAnalysisRecord,
    InstrumentAnalysisRecord,
    Log,
    Otp,
    Project,
    RefreshToken,
    User,
)
from src.database.session import get_db
from src.schemas.user import (
    PasswordChange,
    UserProfile,
    UserProfileUpdate,
)
from src.services.auth_service import AuthService
from src.services.dependencies import get_current_user

router = APIRouter()

@router.get("/profile", response_model=UserProfile)
async def get_profile(
    current_user: User = Depends(get_current_user),
):
    return UserProfile(
        id=str(current_user.id),
        name=current_user.name,
        username=current_user.username,
        email=current_user.email,
        created_at=current_user.created_at,
        email_verified=current_user.email_verified,
    )

@router.put("/profile")
async def update_profile(
    profile_update: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not profile_update.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    try:
        current_user.name = profile_update.name

        await db.commit()
        await db.refresh(current_user)

        return {
            "message": "Profile updated successfully",
            "user": {
                "id": str(current_user.id),
                "name": current_user.name,
                "username": current_user.username,
                "email": current_user.email,
            },
        }

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}",
        )

@router.post("/change-password")
async def change_password(
    password_change: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not AuthService.verify_password(
        password_change.current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect",
        )
    try:
        current_user.password_hash = AuthService.hash_password(
            password_change.new_password
        )

        await db.commit()
        return {
            "message": "Password changed successfully"
        }

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to update password: {str(e)}",
        )

@router.delete("/account")
async def delete_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        user_id = current_user.id

        result = await db.execute(
            select(Project.id).where(
                Project.user_id == user_id
            )
        )

        project_ids = result.scalars().all()
        analysis_ids = []

        if project_ids:
            analysis_result = await db.execute(
                select(AnalysisRecord.id).where(
                    AnalysisRecord.project_id.in_(project_ids)
                )
            )
            analysis_ids = analysis_result.scalars().all()

        audio_file_ids = []

        if project_ids:
            audio_result = await db.execute(
                select(AudioFile.id).where(
                    AudioFile.project_id.in_(project_ids)
                )
            )
            audio_file_ids = audio_result.scalars().all()

        if analysis_ids:
            await db.execute(
                InstrumentAnalysisRecord.__table__.delete().where(
                    InstrumentAnalysisRecord.id.in_(analysis_ids)
                )
            )

        if audio_file_ids:
            await db.execute(
                AudioFeature.__table__.delete().where(
                    AudioFeature.audio_file_id.in_(audio_file_ids)
                )
            )

        if analysis_ids:
            await db.execute(
                FeatureAnalysisRecord.__table__.delete().where(
                    FeatureAnalysisRecord.id.in_(analysis_ids)
                )
            )

        if project_ids:
            await db.execute(
                AnalysisRecord.__table__.delete().where(
                    AnalysisRecord.project_id.in_(project_ids)
                )
            )

        if audio_file_ids:
            await db.execute(
                AudioFile.__table__.delete().where(
                    AudioFile.id.in_(audio_file_ids)
                )
            )

        await db.execute(
            Log.__table__.delete().where(
                Log.user_id == user_id
            )
        )

        await db.execute(
            Otp.__table__.delete().where(
                Otp.user_id == user_id
            )
        )

        await db.execute(
            RefreshToken.__table__.delete().where(
                RefreshToken.user_id == user_id
            )
        )

        if project_ids:
            await db.execute(
                Project.__table__.delete().where(
                    Project.id.in_(project_ids)
                )
            )

        # Delete user
        await db.delete(current_user)

        await db.commit()

        return {
            "message": "Account deleted successfully"
        }

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting account: {str(e)}",
        )


@router.get("/profile-analysis")
async def get_profile_analysis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        user_id = current_user.id

        project_result = await db.execute(
            select(Project).where(
                Project.user_id == user_id
            )
        )

        projects = project_result.scalars().all()

        project_ids = [
            project.id for project in projects
        ]

        audio_files = []

        if project_ids:
            audio_result = await db.execute(
                select(AudioFile).where(
                    AudioFile.project_id.in_(project_ids)
                )
            )

            audio_files = audio_result.scalars().all()


        analysis_records = []

        if project_ids:
            analysis_result = await db.execute(
                select(AnalysisRecord).where(
                    AnalysisRecord.project_id.in_(project_ids)
                )
            )

            analysis_records = (
                analysis_result.scalars().all()
            )


        instrument_counter = Counter()

        for analysis in analysis_records:

            if analysis.analysis_type.value == "instrument":

                results = analysis.results or {}

                detected_instruments = results.get(
                    "detected_instruments",
                    [],
                )

                if isinstance(
                    detected_instruments,
                    list,
                ):

                    for item in detected_instruments:

                        instrument_name = item.get(
                            "instrument"
                        )

                        if instrument_name:
                            instrument_counter[
                                instrument_name
                            ] += 1

        top_instruments = [
            {
                "instrument": name,
                "count": count,
            }
            for name, count in instrument_counter.most_common(
                10
            )
        ]

        favorite_instrument = None

        if top_instruments:
            favorite_instrument = top_instruments[0]


        emotion_scores = defaultdict(list)

        for analysis in analysis_records:

            if analysis.analysis_type.value == "emotion":

                results = analysis.results or {}

                static_data = results.get(
                    "static",
                    {},
                )

                emotions = static_data.get(
                    "emotions",
                    {},
                )

                if isinstance(emotions, dict):

                    for emotion, score in emotions.items():

                        try:
                            emotion_scores[
                                emotion
                            ].append(float(score))

                        except Exception:
                            pass

        emotion_breakdown = {}

        for emotion, scores in emotion_scores.items():

            emotion_breakdown[emotion] = round(
                sum(scores) / len(scores),
                4,
            )

        dominant_emotion = None

        if emotion_breakdown:
            dominant_emotion = max(
                emotion_breakdown,
                key=emotion_breakdown.get,
            )


        total_duration = round(
            sum(
                audio.duration or 0
                for audio in audio_files
            ),
            2,
        )

        total_storage = sum(
            audio.file_size or 0
            for audio in audio_files
        )

        average_song_duration = 0

        if audio_files:
            average_song_duration = round(
                total_duration / len(audio_files),
                2,
            )


        format_counter = Counter()

        for audio in audio_files:

            if audio.format:
                format_counter[
                    str(audio.format.value)
                ] += 1

        audio_formats = [
            {
                "format": key,
                "count": value,
            }
            for key, value in format_counter.items()
        ]


        analysis_type_counter = Counter()

        for analysis in analysis_records:

            analysis_type_counter[
                analysis.analysis_type.value
            ] += 1

        analysis_distribution = [
            {
                "analysis_type": key,
                "count": value,
            }
            for key, value in analysis_type_counter.items()
        ]


        recent_projects = sorted(
            projects,
            key=lambda x: x.created_at,
            reverse=True,
        )[:5]

        recent_project_list = [
            {
                "id": str(project.id),
                "name": project.name,
                "created_at": project.created_at,
            }
            for project in recent_projects
        ]

        return {
            "user": {
                "id": str(current_user.id),
                "name": current_user.name,
                "email": current_user.email,
                "username": current_user.username,
                "created_at": current_user.created_at,
            },
            "stats": {
                "total_projects": len(projects),
                "total_songs": len(audio_files),
                "total_analyses": len(
                    analysis_records
                ),
                "total_duration_seconds": total_duration,
                "average_song_duration_seconds": average_song_duration,
                "total_storage_bytes": total_storage,
            },
            "music_profile": {
                "favorite_instrument": favorite_instrument,
                "dominant_emotion": dominant_emotion,
                "audio_formats": audio_formats,
            },
            "emotion_score_breakdown": emotion_breakdown,
            "top_instruments": top_instruments,
            "analysis_distribution": analysis_distribution,
            "recent_projects": recent_project_list,
        }

    except Exception as e:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch profile analysis: {str(e)}",
        )