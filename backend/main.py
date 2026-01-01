"""
FastAPI Backend for DevChat Local
Provides OAuth endpoints for GitHub and Google authentication
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import httpx
import os
from typing import Optional
from pydantic import BaseModel

app = FastAPI(title="DevChat Local API", version="1.0.0")

# CORS settings - adjust origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth Configuration
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5000")


class UserResponse(BaseModel):
    login: str
    avatar_url: str
    email: Optional[str]
    id: str
    provider: str


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "DevChat Local API",
        "version": "1.0.0"
    }


@app.get("/auth/github/login")
async def github_login():
    """Redirect to GitHub OAuth"""
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
    
    redirect_uri = f"{FRONTEND_URL}/api/auth/github/callback"
    github_auth_url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={GITHUB_CLIENT_ID}&"
        f"redirect_uri={redirect_uri}&"
        f"scope=user:email"
    )
    return RedirectResponse(github_auth_url)


@app.get("/auth/github/callback")
async def github_callback(code: str):
    """Handle GitHub OAuth callback"""
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
    
    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_response.json()
        
        if "access_token" not in token_data:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        access_token = token_data["access_token"]
        
        # Get user information
        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
            },
        )
        user_data = user_response.json()
        
        # Get user email if not public
        email = user_data.get("email")
        if not email:
            emails_response = await client.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json",
                },
            )
            emails = emails_response.json()
            primary_email = next(
                (e for e in emails if e.get("primary")),
                emails[0] if emails else None
            )
            if primary_email:
                email = primary_email["email"]
        
        # Create user object
        user = UserResponse(
            login=user_data["login"],
            avatar_url=user_data["avatar_url"],
            email=email,
            id=str(user_data["id"]),
            provider="github"
        )
        
        # Redirect back to frontend with user data
        # In production, you'd use JWT tokens or sessions
        redirect_url = f"{FRONTEND_URL}?auth=success&token={access_token}"
        return RedirectResponse(redirect_url)


@app.get("/auth/google/login")
async def google_login():
    """Redirect to Google OAuth"""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    redirect_uri = f"{FRONTEND_URL}/api/auth/google/callback"
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope=openid email profile&"
        f"access_type=offline"
    )
    return RedirectResponse(google_auth_url)


@app.get("/auth/google/callback")
async def google_callback(code: str):
    """Handle Google OAuth callback"""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": f"{FRONTEND_URL}/api/auth/google/callback",
            },
        )
        token_data = token_response.json()
        
        if "access_token" not in token_data:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        access_token = token_data["access_token"]
        
        # Get user information
        user_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_data = user_response.json()
        
        # Create user object
        user = UserResponse(
            login=user_data.get("name", user_data["email"].split("@")[0]),
            avatar_url=user_data.get("picture", ""),
            email=user_data["email"],
            id=user_data["id"],
            provider="google"
        )
        
        # Redirect back to frontend
        redirect_url = f"{FRONTEND_URL}?auth=success&token={access_token}"
        return RedirectResponse(redirect_url)


@app.get("/auth/user")
async def get_user(token: str):
    """Get user information from token"""
    # This is a simplified version
    # In production, validate JWT tokens and return user info
    raise HTTPException(status_code=501, detail="Not implemented")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
