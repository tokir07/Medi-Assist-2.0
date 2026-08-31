from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc, asc
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timezone
import uuid
import logging

from app.models.health_tip import HealthTip, SavedHealthTip, DailyTipReminder, HealthTipView
from app.models.medical_record import MedicalRecord
from app.database.models import Patient
from app.schemas.health_tip import (
    HealthTipResponse,
    HealthTipListResponse,
    CategoryCountResponse,
    CategoryCountItem,
    DailyTipReminderResponse,
    DailyTipReminderUpdate,
    PersonalizePreferencesPayload,
    HealthActivityResponse
)

logger = logging.getLogger(__name__)

STANDARD_CATEGORIES = [
    {"name": "Nutrition", "icon": "utensils", "description": "Dietary balance, whole foods & hydration"},
    {"name": "Sleep", "icon": "moon", "description": "Circadian rhythms, sleep hygiene & deep rest"},
    {"name": "Fitness", "icon": "activity", "description": "Movement, posture, mobility & strength"},
    {"name": "Mental Wellness", "icon": "brain", "description": "Mindfulness, stress relief & cognitive health"},
    {"name": "Preventive Care", "icon": "shield-check", "description": "Routine checkups, lab awareness & screening"},
    {"name": "Medication Awareness", "icon": "pill", "description": "Safe usage, label literacy & storage"},
    {"name": "General Wellness", "icon": "heart", "description": "Daily vitality, eye strain & lifestyle habits"}
]

CURATED_EDUCATIONAL_TIPS = [
    # 1. Nutrition
    {
        "title": "Start Your Day with Warm Water & Balanced Hydration",
        "summary": "Drinking warm water upon waking supports metabolic activation, aids gentle digestion, and rehydrates after sleep.",
        "content": """Starting your morning with a glass of warm water is a simple, evidence-backed ritual that offers metabolic and digestive benefits.

### Key Health Benefits
1. **Rehydration**: After 7 to 8 hours of rest, the body is naturally dehydrated. Gentle warm water provides cellular hydration without shocking the digestive system.
2. **Digestive Activation**: Stimulates gastric motility and prepares the GI tract for nutrient absorption during breakfast.
3. **Electrolyte Support**: Pairing morning hydration with a pinch of lemon or balanced electrolytes helps maintain cellular fluid equilibrium.

### Practical Habit
Drink a tall glass of lukewarm water 15–20 minutes before consuming morning caffeine or breakfast.
""",
        "category": "Nutrition",
        "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80",
        "read_time": "3 min read",
        "is_featured": True,
        "is_popular": True,
        "popularity_rank": 1,
        "author": "Dr. Priya Sharma, Senior Physician",
        "source": "MediAssist Clinical Guidelines & Dietary Standards",
        "reviewed_by": "Dr. Priya Sharma, MD",
        "tags": "hydration, morning routine, digestion, metabolism"
    },
    {
        "title": "Understanding the Glycemic Index of Everyday Foods",
        "summary": "Learn how complex versus simple carbohydrates impact energy levels, blood glucose stability, and cognitive stamina.",
        "content": """The Glycemic Index (GI) ranks carbohydrate foods by how quickly they raise blood glucose levels compared to pure glucose.

### High vs. Low GI Foods
- **Low GI (55 or less)**: Whole oats, lentils, non-starchy vegetables, and quinoa provide sustained energy release without steep insulin spikes.
- **Medium GI (56–69)**: Brown rice, sweet potatoes, and whole grain breads.
- **High GI (70+)**: White bread, sugary sodas, and refined pastries cause rapid glycemic surges followed by energy slumps.

### Everyday Tip
Pair carbohydrates with healthy fats and proteins (such as nuts or yogurt) to naturally slow glucose absorption and maintain steady energy throughout work or study hours.
""",
        "category": "Nutrition",
        "image_url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
        "read_time": "4 min read",
        "is_featured": False,
        "is_popular": True,
        "popularity_rank": 2,
        "author": "Dr. Sarah Jenkins, Clinical Nutritionist",
        "source": "Clinical Nutrition Reference & Harvard Health Publishing",
        "reviewed_by": "Dr. Sarah Jenkins, MD",
        "tags": "glycemic index, blood sugar, nutrition, whole foods"
    },

    # 2. Sleep
    {
        "title": "Healthy Sleep Hygiene & Circadian Alignment",
        "summary": "Consistent bedtimes and light management optimize melatonin production and restorative slow-wave sleep.",
        "content": """Sleep hygiene encompasses environmental and behavioral practices that promote consistent, uninterrupted sleep quality.

### Core Sleep Principles
1. **Regular Sleep Window**: Going to bed and waking up at consistent times strengthens your circadian pacemaker.
2. **Evening Light Attenuation**: Blue light from laptops and smartphones suppresses nocturnal melatonin synthesis. Dim ambient lights 60 minutes before bedtime.
3. **Thermal Comfort**: A cool room temperature (18–20°C / 65–68°F) facilitates the natural core body temperature drop required for deep sleep.

### Practical Habit
Establish a 20-minute wind-down routine consisting of reading, gentle stretching, or listening to calming sounds without screens.
""",
        "category": "Sleep",
        "image_url": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop&q=80",
        "read_time": "4 min read",
        "is_featured": True,
        "is_popular": True,
        "popularity_rank": 3,
        "author": "Dr. Arun Mehta, Sleep Specialist",
        "source": "National Sleep Foundation & American Academy of Sleep Medicine",
        "reviewed_by": "Dr. Arun Mehta, MD",
        "tags": "sleep, circadian rhythm, rest, insomnia, recovery"
    },
    {
        "title": "Managing Blue Light & Screen Fatigue Before Bed",
        "summary": "Reducing artificial blue spectrum light during evening hours prevents sleep latency delays and morning grogginess.",
        "content": """Digital screens emit high-energy visible (HEV) blue light that signals daylight to the suprachiasmatic nucleus.

### Simple Steps to Reduce Nighttime Strain
- Enable 'Night Shift' or warm-color display filters after 8:00 PM.
- Avoid watching intense video media directly in bed.
- Keep your phone charger outside arms-reach from your bed to prevent late-night scrolling.
""",
        "category": "Sleep",
        "image_url": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80",
        "read_time": "3 min read",
        "is_featured": False,
        "is_popular": False,
        "popularity_rank": 4,
        "author": "Dr. Kavita Joshi, Clinical Neuroscientist",
        "source": "American Academy of Ophthalmology",
        "reviewed_by": "Dr. Kavita Joshi, PhD",
        "tags": "blue light, screens, sleep latency, eyes"
    },

    # 3. Fitness
    {
        "title": "10-Minute Desk Stretching & Postural Health",
        "summary": "Short postural breaks reduce spinal compression, relieve neck strain, and restore healthy hip flexor mobility.",
        "content": """Prolonged static sitting leads to shortening of the hip flexors, rounding of the thoracic spine, and forward head posture.

### Simple Desk Exercises
1. **Chin Tucks**: Gently retract your chin to align cervical vertebrae above shoulders.
2. **Seated Spinal Twist**: Place one hand on the opposite knee and gently rotate through the thoracic spine.
3. **Chest Opener**: Interlace fingers behind your back and open the chest to reverse slumped shoulder positioning.
4. **Standing Hip Extension**: Stand up and push your hips gently forward to open the anterior hip capsule.

### The 30-Minute Micro-Break Rule
Stand up or change body position for 60 seconds every 30 to 45 minutes of computer work.
""",
        "category": "Fitness",
        "image_url": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80",
        "read_time": "3 min read",
        "is_featured": False,
        "is_popular": True,
        "popularity_rank": 5,
        "author": "Dr. Neha Verma, Orthopedic Specialist",
        "source": "American Physical Therapy Association",
        "reviewed_by": "Dr. Neha Verma, MS Ortho",
        "tags": "posture, stretching, ergonomics, back pain, mobility"
    },

    # 4. Mental Wellness
    {
        "title": "The Power of 5-Minute Diaphragmatic Breathing",
        "summary": "Deep belly breathing stimulates the vagus nerve, decreases acute stress hormones, and restores calm focus.",
        "content": """Diaphragmatic breathing (also known as box breathing or belly breathing) is a proven technique for activating parasympathetic tone.

### How to Practice
1. **Inhale (4 seconds)**: Inhale slowly through your nose, expanding your lower abdomen rather than chest.
2. **Hold (4 seconds)**: Pause gently without straining.
3. **Exhale (4 seconds)**: Release air smoothly through your mouth.
4. **Hold (4 seconds)**: Rest before the next inhalation.

Repeat for 4 to 6 cycles whenever you experience work or study pressure.
""",
        "category": "Mental Wellness",
        "image_url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80",
        "read_time": "3 min read",
        "is_featured": True,
        "is_popular": True,
        "popularity_rank": 6,
        "author": "Dr. Kavita Joshi, Clinical Psychologist",
        "source": "Mindfulness & Psychotherapy Institute",
        "reviewed_by": "Dr. Kavita Joshi, PhD",
        "tags": "breathing, stress management, vagus nerve, mental health"
    },

    # 5. Preventive Care
    {
        "title": "Understanding Routine Preventive Lab Screenings",
        "summary": "Learn what common markers like Fasting Glucose, Lipid Profiles, and Complete Blood Counts signify.",
        "content": """Periodic preventive screening offers a valuable baseline to track longitudinal wellness trends before clinical symptoms appear.

### Common Preventive Panels
- **Complete Blood Count (CBC)**: Measures red blood cells, white blood cells, and platelets to assess oxygen-carrying capacity and immune status.
- **Fasting Lipid Profile**: Evaluates Total Cholesterol, HDL (protective), LDL, and Triglycerides to understand cardiovascular health.
- **Fasting Blood Glucose & HbA1c**: Evaluates glucose regulation over short and 3-month timeframes.
- **Kidney & Liver Function**: Checks creatinine, BUN, and liver enzymes for metabolic clearance.

### When to Consult
Review all laboratory results with your primary care physician for individualized medical interpretation in the context of your overall health history.
""",
        "category": "Preventive Care",
        "image_url": "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&auto=format&fit=crop&q=80",
        "read_time": "5 min read",
        "is_featured": True,
        "is_popular": True,
        "popularity_rank": 7,
        "author": "Dr. Priya Sharma, Senior Physician",
        "source": "MediAssist Preventive Medicine Panel",
        "reviewed_by": "Dr. Priya Sharma, MD",
        "tags": "lab tests, blood test, prevention, cholesterol, glucose"
    },

    # 6. Medication Awareness
    {
        "title": "Safe Medication Habits & Label Literacy",
        "summary": "Understanding prescription directions, expiration dates, and proper storage keeps medicines safe and effective.",
        "content": """Prescribed medications provide optimal therapeutic value when taken according to doctor instructions and stored correctly.

### Essential Guidelines
1. **Follow Exact Schedules**: Taking doses at consistent times maintains steady therapeutic drug concentrations.
2. **Store in Cool, Dry Places**: Avoid bathroom cabinets with high humidity and heat. Keep medications away from direct sunlight and children.
3. **Know Food Interactions**: Always verify whether a medicine should be taken on an empty stomach or with a meal.
4. **Never Alter Dosages Independently**: Always consult your prescribing clinician before stopping or modifying medications.
""",
        "category": "Medication Awareness",
        "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80",
        "read_time": "4 min read",
        "is_featured": False,
        "is_popular": False,
        "popularity_rank": 8,
        "author": "Dr. Rajiv Kapoor, Pharmacologist",
        "source": "FDA Consumer Health Guidelines",
        "reviewed_by": "Dr. Rajiv Kapoor, MD Pharmacology",
        "tags": "medication safety, prescriptions, dosage, pharmacy"
    },

    # 7. General Wellness
    {
        "title": "Combatting Digital Eye Strain with the 20-20-20 Rule",
        "summary": "Protect your vision and prevent dry, fatigued eyes during prolonged reading and computer sessions.",
        "content": """When concentrating on digital displays, blink rate drops from 15 times per minute to under 5 to 7 times, causing tear film evaporation.

### The 20-20-20 Method
Every **20 minutes**, look away from your screen at an object **20 feet away** for at least **20 seconds**.

### Additional Protective Steps
- Position screen 50–60 cm away with the top of the monitor slightly below eye level.
- Ensure ambient room illumination matches screen brightness to reduce high-contrast glare.
""",
        "category": "General Wellness",
        "image_url": "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=800&auto=format&fit=crop&q=80",
        "read_time": "3 min read",
        "is_featured": False,
        "is_popular": True,
        "popularity_rank": 9,
        "author": "Dr. Sunita Rao, Wellness Consultant",
        "source": "American Academy of Ophthalmology",
        "reviewed_by": "Dr. Sunita Rao, MD",
        "tags": "eye strain, 20-20-20, vision, screen time, wellness"
    }
]

class HealthTipService:
    @staticmethod
    def ensure_curated_health_tips(db: Session):
        """Seeds curated educational content if database is empty."""
        count = db.query(HealthTip).count()
        if count < len(CURATED_EDUCATIONAL_TIPS):
            existing_titles = {t[0] for t in db.query(HealthTip.title).all()}
            for item in CURATED_EDUCATIONAL_TIPS:
                if item["title"] not in existing_titles:
                    tip = HealthTip(
                        id=str(uuid.uuid4()),
                        title=item["title"],
                        summary=item["summary"],
                        content=item["content"],
                        category=item["category"],
                        image_url=item.get("image_url"),
                        read_time=item.get("read_time", "3 min read"),
                        is_featured=item.get("is_featured", False),
                        is_popular=item.get("is_popular", False),
                        popularity_rank=item.get("popularity_rank"),
                        author=item.get("author", "MediAssist Clinical Advisory"),
                        source=item.get("source", "MediAssist Medical Advisory & Evidence-Based Guidelines"),
                        reviewed_by=item.get("reviewed_by", "Dr. Priya Sharma, MD"),
                        status="Published",
                        tags=item.get("tags")
                    )
                    db.add(tip)
            db.commit()

    @staticmethod
    def _to_response(t: HealthTip, saved_ids: Set[str], recommendation_reason: Optional[str] = None) -> HealthTipResponse:
        return HealthTipResponse(
            id=t.id,
            title=t.title,
            summary=t.summary,
            content=t.content,
            category=t.category,
            image_url=t.image_url,
            read_time=t.read_time or "3 min read",
            is_featured=bool(t.is_featured),
            is_popular=bool(t.is_popular),
            popularity_rank=t.popularity_rank,
            author=t.author or "MediAssist Clinical Advisory",
            source=t.source or "MediAssist Medical Advisory & Evidence-Based Guidelines",
            reviewed_by=t.reviewed_by or "Dr. Priya Sharma, MD",
            status=t.status or "Published",
            tags=t.tags,
            is_saved=t.id in saved_ids,
            recommendation_reason=recommendation_reason,
            created_at=t.created_at,
            updated_at=t.updated_at
        )

    def get_health_tips(
        self,
        db: Session,
        patient_id: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        saved_only: bool = False,
        page: int = 1,
        page_size: int = 12
    ) -> HealthTipListResponse:
        self.ensure_curated_health_tips(db)

        saved_ids: Set[str] = set()
        if patient_id:
            saved_records = db.query(SavedHealthTip.tip_id).filter(SavedHealthTip.patient_id == patient_id).all()
            saved_ids = {r[0] for r in saved_records}

        query = db.query(HealthTip).filter(HealthTip.status == "Published")

        if saved_only:
            if not patient_id or not saved_ids:
                return HealthTipListResponse(tips=[], total_count=0, page=page, page_size=page_size, total_pages=1)
            query = query.filter(HealthTip.id.in_(saved_ids))

        if category and category not in ["All", "All Tips"]:
            query = query.filter(HealthTip.category.ilike(f"%{category.strip()}%"))

        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    HealthTip.title.ilike(s),
                    HealthTip.summary.ilike(s),
                    HealthTip.content.ilike(s),
                    HealthTip.tags.ilike(s),
                    HealthTip.category.ilike(s)
                )
            )

        total_count = query.count()
        total_pages = max(1, (total_count + page_size - 1) // page_size)
        offset = (page - 1) * page_size
        items = query.order_by(desc(HealthTip.is_featured), desc(HealthTip.created_at)).offset(offset).limit(page_size).all()

        return HealthTipListResponse(
            tips=[HealthTipService._to_response(t, saved_ids) for t in items],
            total_count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    def get_tip_of_the_day(self, db: Session, patient_id: Optional[str] = None) -> Optional[HealthTipResponse]:
        self.ensure_curated_health_tips(db)
        saved_ids: Set[str] = set()
        if patient_id:
            saved_records = db.query(SavedHealthTip.tip_id).filter(SavedHealthTip.patient_id == patient_id).all()
            saved_ids = {r[0] for r in saved_records}

        published_tips = db.query(HealthTip).filter(HealthTip.status == "Published").order_by(asc(HealthTip.created_at)).all()
        if not published_tips:
            return None

        # Select deterministically by day of year
        day_of_year = datetime.now(timezone.utc).timetuple().tm_yday
        selected_index = day_of_year % len(published_tips)
        today_tip = published_tips[selected_index]

        return HealthTipService._to_response(today_tip, saved_ids, recommendation_reason="Featured Daily Health Education")

    def get_recommended_tips(self, db: Session, patient_id: Optional[str] = None, limit: int = 4) -> List[HealthTipResponse]:
        self.ensure_curated_health_tips(db)
        saved_ids: Set[str] = set()
        if patient_id:
            saved_records = db.query(SavedHealthTip.tip_id).filter(SavedHealthTip.patient_id == patient_id).all()
            saved_ids = {r[0] for r in saved_records}

        # Calculate simple deterministic category weights
        category_weights: Dict[str, int] = {}
        category_reasons: Dict[str, str] = {}

        if patient_id:
            # 1. Weights from Saved Tips
            saved_tips = db.query(HealthTip.category).join(SavedHealthTip).filter(SavedHealthTip.patient_id == patient_id).all()
            for (cat,) in saved_tips:
                category_weights[cat] = category_weights.get(cat, 0) + 3
                category_reasons[cat] = f"Recommended based on your interest in {cat} topics."

            # 2. Weights from Recently Viewed
            views = db.query(HealthTip.category).join(HealthTipView).filter(HealthTipView.patient_id == patient_id).all()
            for (cat,) in views:
                category_weights[cat] = category_weights.get(cat, 0) + 2
                if cat not in category_reasons:
                    category_reasons[cat] = f"Recommended because you recently explored {cat}."

        all_published = db.query(HealthTip).filter(HealthTip.status == "Published").all()
        scored_tips = []

        for tip in all_published:
            score = category_weights.get(tip.category, 1)
            if tip.is_featured:
                score += 1
            if tip.is_popular:
                score += 1
            reason = category_reasons.get(tip.category, "Recommended as practical everyday preventive health guidance.")
            scored_tips.append((score, tip, reason))

        # Sort by score descending
        scored_tips.sort(key=lambda x: x[0], reverse=True)
        top_tips = scored_tips[:limit]

        return [HealthTipService._to_response(item[1], saved_ids, recommendation_reason=item[2]) for item in top_tips]

    def get_featured_tips(self, db: Session, patient_id: Optional[str] = None) -> List[HealthTipResponse]:
        self.ensure_curated_health_tips(db)
        saved_ids: Set[str] = set()
        if patient_id:
            saved_records = db.query(SavedHealthTip.tip_id).filter(SavedHealthTip.patient_id == patient_id).all()
            saved_ids = {r[0] for r in saved_records}

        featured = db.query(HealthTip).filter(HealthTip.is_featured == True, HealthTip.status == "Published").order_by(desc(HealthTip.created_at)).limit(3).all()
        if not featured:
            featured = db.query(HealthTip).filter(HealthTip.status == "Published").limit(3).all()

        return [HealthTipService._to_response(t, saved_ids) for t in featured]

    def get_categories_summary(self, db: Session) -> CategoryCountResponse:
        self.ensure_curated_health_tips(db)
        cats = db.query(HealthTip.category, func.count(HealthTip.id)).filter(HealthTip.status == "Published").group_by(HealthTip.category).all()
        cat_map = {c[0]: c[1] for c in cats}

        items: List[CategoryCountItem] = []
        total_all = 0

        for std in STANDARD_CATEGORIES:
            name = std["name"]
            count = cat_map.get(name, 0)
            total_all += count
            items.append(CategoryCountItem(
                category=name,
                count=count,
                icon=std["icon"],
                description=std["description"]
            ))

        # Any extra custom categories
        for cat_name, count in cat_map.items():
            if not any(s["name"].lower() == cat_name.lower() for s in STANDARD_CATEGORIES):
                total_all += count
                items.append(CategoryCountItem(
                    category=cat_name,
                    count=count,
                    icon="tag",
                    description="General health guidance"
                ))

        return CategoryCountResponse(categories=items, total_all_tips=total_all)

    def get_popular_tips(self, db: Session, patient_id: Optional[str] = None, limit: int = 5) -> List[HealthTipResponse]:
        self.ensure_curated_health_tips(db)
        saved_ids: Set[str] = set()
        if patient_id:
            saved_records = db.query(SavedHealthTip.tip_id).filter(SavedHealthTip.patient_id == patient_id).all()
            saved_ids = {r[0] for r in saved_records}

        popular = db.query(HealthTip).filter(HealthTip.is_popular == True, HealthTip.status == "Published").order_by(asc(HealthTip.popularity_rank)).limit(limit).all()
        if not popular:
            popular = db.query(HealthTip).filter(HealthTip.status == "Published").limit(limit).all()

        return [HealthTipService._to_response(t, saved_ids) for t in popular]

    def get_tip_by_id(self, db: Session, tip_id: str, patient_id: Optional[str] = None) -> Optional[HealthTipResponse]:
        self.ensure_curated_health_tips(db)
        t = db.query(HealthTip).filter(HealthTip.id == tip_id, HealthTip.status == "Published").first()
        if not t:
            return None

        saved_ids: Set[str] = set()
        if patient_id:
            saved_records = db.query(SavedHealthTip.tip_id).filter(SavedHealthTip.patient_id == patient_id).all()
            saved_ids = {r[0] for r in saved_records}
            # Record view
            self.record_tip_view(db, patient_id, tip_id)

        return HealthTipService._to_response(t, saved_ids)

    def record_tip_view(self, db: Session, patient_id: str, tip_id: str):
        try:
            view = HealthTipView(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                tip_id=tip_id,
                viewed_at=datetime.now(timezone.utc)
            )
            db.add(view)
            db.commit()
        except Exception as e:
            logger.warning(f"Failed to record health tip view: {e}")

    def get_recently_viewed(self, db: Session, patient_id: str, limit: int = 6) -> List[HealthTipResponse]:
        views = db.query(HealthTipView.tip_id).filter(
            HealthTipView.patient_id == patient_id
        ).order_by(desc(HealthTipView.viewed_at)).limit(limit * 2).all()

        seen: Set[str] = set()
        unique_tip_ids = []
        for (t_id,) in views:
            if t_id not in seen:
                seen.add(t_id)
                unique_tip_ids.append(t_id)
            if len(unique_tip_ids) >= limit:
                break

        if not unique_tip_ids:
            return []

        saved_records = db.query(SavedHealthTip.tip_id).filter(SavedHealthTip.patient_id == patient_id).all()
        saved_ids = {r[0] for r in saved_records}

        tips = db.query(HealthTip).filter(HealthTip.id.in_(unique_tip_ids), HealthTip.status == "Published").all()
        tip_dict = {t.id: t for t in tips}

        ordered_tips = [tip_dict[tid] for tid in unique_tip_ids if tid in tip_dict]
        return [HealthTipService._to_response(t, saved_ids, recommendation_reason="Recently Viewed") for t in ordered_tips]

    def get_saved_tips(self, db: Session, patient_id: str) -> List[HealthTipResponse]:
        saved_records = db.query(SavedHealthTip.tip_id).filter(SavedHealthTip.patient_id == patient_id).all()
        saved_ids = {r[0] for r in saved_records}
        if not saved_ids:
            return []

        tips = db.query(HealthTip).filter(HealthTip.id.in_(saved_ids), HealthTip.status == "Published").order_by(desc(HealthTip.created_at)).all()
        return [HealthTipService._to_response(t, saved_ids) for t in tips]

    def toggle_save_tip(self, db: Session, patient_id: str, tip_id: str) -> bool:
        existing = db.query(SavedHealthTip).filter(
            SavedHealthTip.patient_id == patient_id,
            SavedHealthTip.tip_id == tip_id
        ).first()

        if existing:
            db.delete(existing)
            db.commit()
            return False
        else:
            save_record = SavedHealthTip(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                tip_id=tip_id
            )
            db.add(save_record)
            db.commit()
            return True

    def get_health_activity(self, db: Session, patient_id: str) -> HealthActivityResponse:
        saved_count = db.query(SavedHealthTip).filter(SavedHealthTip.patient_id == patient_id).count()
        recent_count = db.query(HealthTipView.tip_id).filter(HealthTipView.patient_id == patient_id).distinct().count()

        today_tip = self.get_tip_of_the_day(db, patient_id)

        # Active category interests
        saved_cats = db.query(HealthTip.category).join(SavedHealthTip).filter(SavedHealthTip.patient_id == patient_id).distinct().limit(4).all()
        interests = [c[0] for c in saved_cats]

        return HealthActivityResponse(
            saved_tips_count=saved_count,
            recently_viewed_count=recent_count,
            today_tip_title=today_tip.title if today_tip else "Start Your Day with Warm Water",
            active_interests=interests
        )

    def get_related_tips(self, db: Session, tip_id: str, category: str, patient_id: Optional[str] = None, limit: int = 3) -> List[HealthTipResponse]:
        saved_ids: Set[str] = set()
        if patient_id:
            saved_records = db.query(SavedHealthTip.tip_id).filter(SavedHealthTip.patient_id == patient_id).all()
            saved_ids = {r[0] for r in saved_records}

        related = db.query(HealthTip).filter(
            HealthTip.category == category,
            HealthTip.id != tip_id,
            HealthTip.status == "Published"
        ).order_by(desc(HealthTip.is_popular), desc(HealthTip.created_at)).limit(limit).all()

        return [HealthTipService._to_response(t, saved_ids) for t in related]

    def get_reminder_settings(self, db: Session, patient_id: str) -> DailyTipReminderResponse:
        record = db.query(DailyTipReminder).filter(DailyTipReminder.patient_id == patient_id).first()
        if not record:
            record = DailyTipReminder(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                is_enabled=True,
                preferred_time="08:00 AM",
                topics="Nutrition,Sleep,General Wellness"
            )
            db.add(record)
            db.commit()
            db.refresh(record)

        topics_list = [t.strip() for t in record.topics.split(",")] if record.topics else ["Nutrition", "Sleep", "General Wellness"]
        return DailyTipReminderResponse(
            is_enabled=record.is_enabled,
            preferred_time=record.preferred_time,
            topics=topics_list
        )

    def update_reminder_settings(self, db: Session, patient_id: str, payload: DailyTipReminderUpdate) -> DailyTipReminderResponse:
        record = db.query(DailyTipReminder).filter(DailyTipReminder.patient_id == patient_id).first()
        if not record:
            record = DailyTipReminder(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                is_enabled=payload.is_enabled if payload.is_enabled is not None else True,
                preferred_time=payload.preferred_time or "08:00 AM",
                topics=",".join(payload.topics) if payload.topics else "Nutrition,Sleep,General Wellness"
            )
            db.add(record)
        else:
            if payload.is_enabled is not None:
                record.is_enabled = payload.is_enabled
            if payload.preferred_time is not None:
                record.preferred_time = payload.preferred_time
            if payload.topics is not None:
                record.topics = ",".join(payload.topics)

        db.commit()
        db.refresh(record)

        topics_list = [t.strip() for t in record.topics.split(",")] if record.topics else ["Nutrition", "Sleep", "General Wellness"]
        return DailyTipReminderResponse(
            is_enabled=record.is_enabled,
            preferred_time=record.preferred_time,
            topics=topics_list
        )

health_tip_service = HealthTipService()
