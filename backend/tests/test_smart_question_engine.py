import pytest
from app.services.ai.smart_question_engine import smart_question_engine

def test_scenario_1_and_3_multi_fact_extraction():
    """
    Test scenario: Multiple facts in one answer ("Subah se headache hai front side mein, moderate pain").
    """
    state = smart_question_engine.initialize_session_state()
    user_input = "Subah se headache hai front side mein, moderate pain."
    
    state = smart_question_engine.extract_facts_from_utterance(user_input, state)
    ans = state.get("answered_information", {})

    assert ans.get("chief_complaint") == "headache"
    assert ans.get("onset") == "this morning"
    assert "frontal" in ans.get("location", "").lower() or "forehead" in ans.get("location", "").lower()
    assert ans.get("severity") == "moderate"

def test_scenario_2_question_repetition_guard_blocked_answered():
    """
    Test scenario: AI candidate question ("When did it start?") blocked when onset is already answered.
    """
    state = smart_question_engine.initialize_session_state()
    state["answered_information"] = {"chief_complaint": "headache", "onset": "4 hours ago"}

    candidate_q = "When did your headache start?"
    allowed, reason = smart_question_engine.is_question_allowed(candidate_q, state)

    assert allowed is False
    assert "INTENT_ALREADY_ANSWERED" in reason

def test_scenario_4_approximate_answer_accepted():
    """
    Test scenario: Approximate answer ("Head") accepted without infinite clarification loops.
    """
    state = smart_question_engine.initialize_session_state()
    state = smart_question_engine.extract_facts_from_utterance("In my head", state)
    
    ans = state.get("answered_information", {})
    assert "location" in ans
    assert ans["location"] == "head region"

def test_scenario_5_question_semantic_similarity_guard():
    """
    Test scenario: Proposed question ("Which area of your head is painful?") blocked
    because previous question ("Where is the pain located?") was already asked.
    """
    state = smart_question_engine.initialize_session_state()
    state = smart_question_engine.record_asked_question("Where is the pain located?", state)

    candidate_q = "Which area of your head is painful?"
    allowed, reason = smart_question_engine.is_question_allowed(candidate_q, state)

    assert allowed is False

def test_scenario_6_and_7_topic_switch_and_return():
    """
    Test scenario: Topic switch to casual and topic return to symptoms.
    """
    state = smart_question_engine.initialize_session_state()

    mode1, topic1 = smart_question_engine.detect_conversation_mode("I have a severe headache", state)
    assert mode1 == "HEALTH_CONSULTATION"
    assert topic1 == "headache"

    state["conversation_mode"] = mode1
    state["current_topic"] = topic1
    state["previous_topic"] = "headache"

    mode2, topic2 = smart_question_engine.detect_conversation_mode("Forget it, tell me something funny", state)
    assert mode2 == "CASUAL"
    assert topic2 == "casual"

    state["conversation_mode"] = mode2
    state["current_topic"] = topic2

    mode3, topic3 = smart_question_engine.detect_conversation_mode("Actually my headache is still there", state)
    assert mode3 == "HEALTH_CONSULTATION"
    assert topic3 == "headache"

def test_scenario_8_follow_up_limit_enforcement():
    """
    Test scenario: Enforcing follow-up question limits.
    """
    state = smart_question_engine.initialize_session_state()
    state["follow_up_count"] = 5

    candidate_q = "How is your appetite today?"
    allowed, reason = smart_question_engine.is_question_allowed(candidate_q, state)

    assert allowed is False
    assert reason == "MAX_FOLLOW_UP_REACHED"
    assert smart_question_engine.should_stop_questioning(state) is True

def test_scenario_9_raw_hinglish_extraction():
    """
    Test scenario: Raw Hinglish spoken transcript preserves facts.
    """
    state = smart_question_engine.initialize_session_state()
    raw_hinglish = "Subah se headache hai aur aage forehead mein dard hai"
    
    state = smart_question_engine.extract_facts_from_utterance(raw_hinglish, state)
    ans = state.get("answered_information", {})

    assert ans.get("chief_complaint") == "headache"
    assert ans.get("onset") == "this morning"
    assert "frontal" in ans.get("location", "").lower() or "forehead" in ans.get("location", "").lower()
