from typing import Dict, List
import json
import logging
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ChatConnectionManager:
    def __init__(self):
        # Maps user_id / profile_id -> List of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected for user/profile: {user_id}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected for user/profile: {user_id}")

    async def send_personal_message(self, message_data: dict, websocket: WebSocket):
        try:
            await websocket.send_json(message_data)
        except Exception as e:
            logger.error(f"Error sending WebSocket message: {e}")

    async def broadcast_to_user(self, user_id: str, message_data: dict):
        if user_id in self.active_connections:
            disconnected_sockets = []
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_json(message_data)
                except Exception as e:
                    logger.error(f"Failed to send to user {user_id}: {e}")
                    disconnected_sockets.append(websocket)
            for ws in disconnected_sockets:
                self.disconnect(ws, user_id)

ws_manager = ChatConnectionManager()
