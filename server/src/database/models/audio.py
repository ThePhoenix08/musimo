# from sqlalchemy import Column, Integer, String, Float, Text, TIMESTAMP, func, ForeignKey, JSON

# from sqlalchemy.orm import relationship
# from ..base import Base
# from .mixins import UUIDMixin, TimestampMixin, UserReferenceMixin

# class Audio(
#     UUIDMixin,
#     TimestampMixin,
#     UserReferenceMixin,
#     Base
# ):
#     __tablename__ = "audios"

#     id = Column(String(20), primary_key=True)
#     user_id = Column(String(12), ForeignKey("users.id", ondelete="CASCADE"))
#     file_path = Column(Text, nullable=False)
#     checksum = Column(String(128), unique=True)
#     duration = Column(Float)
#     sample_rate = Column(Integer)
#     channels = Column(Integer)
#     format = Column(String(20))
#     created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

#     analyses = relationship("AudioAnalysis", back_populates="audio", cascade="all, delete-orphan")


# class AudioMetadata(Base):
#     __tablename__ = "audio_metadata"

#     id = Column(String(20), primary_key=True)
#     audio_id = Column(String(20), ForeignKey("audios.id", ondelete="CASCADE"))
#     basic_features = Column(JSON)
#     low_level_features = Column(JSON)
#     mid_level_features = Column(JSON)
#     high_level_features = Column(JSON)
#     created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())