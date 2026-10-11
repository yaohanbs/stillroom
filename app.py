import json
import os
import sqlite3
from pathlib import Path
from uuid import uuid4
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

ROOT = Path(__file__).parent
app = FastAPI(title='Stillroom')

def connection():
    db = sqlite3.connect(ROOT / 'stillroom.db')
    db.execute('CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY, data TEXT NOT NULL)')
    return db

class Workspace(BaseModel):
    data: dict

@app.get('/api/workspace')
def read_workspace():
    with connection() as db:
        row = db.execute('SELECT data FROM workspace WHERE id=1').fetchone()
    return {'data': json.loads(row[0]) if row else None}

@app.put('/api/workspace')
def save_workspace(body: Workspace):
    if len(json.dumps(body.data)) > 5_000_000:
        raise HTTPException(413, 'Workspace exceeds 5 MB. Export and remove large notes.')
    with connection() as db:
        db.execute('INSERT OR REPLACE INTO workspace VALUES (1,?)', (json.dumps(body.data),))
    return {'saved': True}

@app.delete('/api/workspace')
def delete_workspace():
    with connection() as db:
        db.execute('DELETE FROM workspace')
    return {'deleted': True}

class PlanRequest(BaseModel):
    goal: str
    minutes: int = 90

class Approval(BaseModel):
    approved: bool

graph = None
try:
    from agent import build_graph
    graph = build_graph(ROOT / 'agent.db')
except ImportError:
    pass

@app.post('/api/plans')
def propose_plan(body: PlanRequest):
    if not graph:
        raise HTTPException(503, 'Install requirements.txt to enable the LangGraph planner.')
    if not body.goal.strip() or not 15 <= body.minutes <= 480:
        raise HTTPException(422, 'Enter a goal and a duration between 15 and 480 minutes.')
    thread = str(uuid4())
    result = graph.invoke({'goal': body.goal, 'minutes': body.minutes}, {'configurable': {'thread_id': thread}})
    return {'id': thread, 'proposal': result['proposal'], 'status': 'awaiting_approval'}

@app.post('/api/plans/{thread}/approve')
def approve_plan(thread: str, body: Approval):
    if not graph:
        raise HTTPException(503, 'Planner unavailable')
    from langgraph.types import Command
    config = {'configurable': {'thread_id': thread}}
    state = graph.get_state(config)
    if not state.next:
        raise HTTPException(404, 'No pending approval for this plan')
    result = graph.invoke(Command(resume=body.approved), config)
    return {'approved': result.get('approved', False), 'proposal': result['proposal']}

@app.get('/api/integrations')
def integrations():
    return {'calendar': 'not_connected', 'gmail': 'not_connected', 'blocking': 'extension_required', 'llm': 'openai' if os.getenv('STILLROOM_LLM') == 'openai' and os.getenv('OPENAI_API_KEY') else 'local_planner', 'maintenance': {'status': 'operational', 'source': 'mock'}}

app.mount('/', StaticFiles(directory=ROOT / 'static', html=True), name='frontend')
