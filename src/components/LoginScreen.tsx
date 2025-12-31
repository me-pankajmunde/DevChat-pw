import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GithubLogo, ChatCircleDots, Lock, CheckCircle } from '@phosphor-icons/react'

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
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
                  Your data is stored locally and synced to your private GitHub repository
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
          
          <Button 
            onClick={onLogin}
            className="w-full h-12 text-base font-medium gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            size="lg"
          >
            <GithubLogo className="h-5 w-5" weight="fill" />
            Sign in with GitHub
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to use your own API credentials and accept responsibility for API usage costs
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
