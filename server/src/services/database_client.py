# # from supabase_client import supabase , create_client
from supabase import create_client, Client
from ..core.settings import settings

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

_supabase_client: Client = None

def get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _supabase_client

def get_supabase_admin_client() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
