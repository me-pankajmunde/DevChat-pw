import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GithubLogo, GoogleLogo, ChatCircleDots, Lock, CheckCircle } from '@phosphor-icons/react'
import { signInWithGitHub, signInWithGoogle } from '@/lib/auth'
import { toast } from 'sonner'

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState<'github' | 'google' | null>(null)

  const handleGitHubLogin = async () => {
    setIsLoading(true)
    setLoadingProvider('github')
    try {
      await signInWithGitHub()
      // OAuth will redirect, so this won't be reached unless there's an error
    } catch (error) {
      if (error instanceof Error && error.message === 'OAUTH_REDIRECT') {
        // This is expected - the OAuth flow will redirect
        return
      }
      console.error('GitHub login failed:', error)
      toast.error('Failed to sign in with GitHub. Please try again.')
      setIsLoading(false)
      setLoadingProvider(null)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setLoadingProvider('google')
    try {
      await signInWithGoogle()
      // OAuth will redirect, so this won't be reached unless there's an error
    } catch (error) {
      if (error instanceof Error && error.message === 'OAUTH_REDIRECT') {
        // This is expected - the OAuth flow will redirect
        return
      }
      console.error('Google login failed:', error)
      toast.error('Failed to sign in with Google. Please try again.')
      setIsLoading(false)
      setLoadingProvider(null)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
      
      <Card className="w-full max-w-md relative z-10 border-border/50 shadow-2xl">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full" />
              <div className="relative bg-gradient-to-br from-primary to-accent p-4 rounded-2xl">
                <ChatCircleDots className="h-12 w-12 text-white" weight="fill" />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            DevChat Local
          </CardTitle>
          <CardDescription className="text-base">
            Developer-focused OpenAI API client
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3 py-4 border-y border-border/50">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 rounded-lg bg-primary/10">
                <Lock className="h-4 w-4 text-primary" weight="fill" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm mb-1">Secure & Private</h3>
                <p className="text-xs text-muted-foreground">
                  Your data is stored locally and optionally synced to your private account
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 rounded-lg bg-primary/10">
                <ChatCircleDots className="h-4 w-4 text-primary" weight="fill" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm mb-1">Custom API Support</h3>
                <p className="text-xs text-muted-foreground">
                  Connect to any OpenAI-compatible API endpoint with your own key
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 rounded-lg bg-primary/10">
                <CheckCircle className="h-4 w-4 text-primary" weight="fill" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm mb-1">Session Management</h3>
                <p className="text-xs text-muted-foreground">
                  Organize chats with folders, tags, and cloud backup
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleGitHubLogin}
              disabled={isLoading}
              className="w-full h-12 text-base font-medium gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all bg-[#24292e] hover:bg-[#1b1f23] text-white"
              size="lg"
            >
              {loadingProvider === 'github' ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Connecting...
                </>
              ) : (
                <>
                  <GithubLogo className="h-5 w-5" weight="fill" />
                  Continue with GitHub
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-12 text-base font-medium gap-2 shadow-lg hover:shadow-xl transition-all bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
              size="lg"
              variant="outline"
            >
              {loadingProvider === 'google' ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                  Connecting...
                </>
              ) : (
                <>
                  <GoogleLogo className="h-5 w-5" weight="fill" />
                  Continue with Google
                </>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to use your own API credentials and accept responsibility for API usage costs
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
