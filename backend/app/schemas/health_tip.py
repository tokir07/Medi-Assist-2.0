from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class HealthTipBase(BaseModel):
    title: str
    summary: str
    content: str
    category: str # Nutrition, Sleep, Fitness, Mental Wellness, Preventive Care, Medication Awareness, General Wellness
    image_url: Optional[str] = None
    read_time: str = "3 min read"
    is_featured: bool = False
    is_popular: bool = False
    popularity_rank: Optional[int] = None
    author: Optional[str] = "MediAssist Clinical Advisory"
    source: Optional[str] = "MediAssist Medical Advisory & Evidence-Based Guidelines"
    reviewed_by: Optional[str] = "Dr. Priya Sharma, MD"
    status: Optional[str] = "Published"
    tags: Optional[str] = None

class HealthTipResponse(HealthTipBase):
    id: str
    is_saved: bool = False
    recommendation_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class HealthTipListResponse(BaseModel):
    tips: List[HealthTipResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int

class CategoryCountItem(BaseModel):
    category: str
    count: int
    icon: Optional[str] = None
    description: Optional[str] = None

class CategoryCountResponse(BaseModel):
    categories: List[CategoryCountItem]
    total_all_tips: int

class DailyTipReminderResponse(BaseModel):
    is_enabled: bool = True
    preferred_time: str = "08:00 AM"
    topics: Optional[List[str]] = None

class DailyTipReminderUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    preferred_time: Optional[str] = None
    topics: Optional[List[str]] = None

class PersonalizePreferencesPayload(BaseModel):
    goals: Optional[List[str]] = None
    topics: Optional[List[str]] = None
    dietary_preference: Optional[str] = None
    activity_level: Optional[str] = None

class HealthActivityResponse(BaseModel):
    saved_tips_count: int
    recently_viewed_count: int
    today_tip_title: Optional[str] = None
    active_interests: List[str] = []

class RecordViewPayload(BaseModel):
    tip_id: str
