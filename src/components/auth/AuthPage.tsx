import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from './AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Heart, Rainbow } from 'lucide-react';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableProviders, setAvailableProviders] = useState({
    google: true, // Will be updated based on actual availability
    apple: true
  });
  
  const { signIn, signUp, signInWithOAuth, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signUp(email, password, {
      username,
      display_name: displayName,
      pronouns,
      bio
    });
    
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Welcome to PrideSphere! ✨",
        description: "Check your email to verify your account and start connecting!"
      });
      // Redirect to profile setup after successful signup
      setTimeout(() => window.location.href = "/profile/setup", 1500);
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Welcome back! 🌈",
        description: "You're now connected to your Pride community!"
      });
      // Redirect to feed after successful signin
      setTimeout(() => window.location.href = "/", 1500);
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to reset your password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please check the email address.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for instructions to reset your password.",
      });
    }
    setLoading(false);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    if (!availableProviders[provider]) {
      toast({
        title: "❗ Login Method Unavailable",
        description: "This login method is temporarily unavailable. Please try signing in with email instead.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { error } = await signInWithOAuth(provider);
    
    if (error) {
      let errorMessage = error.message;
      
      // Handle specific OAuth provider errors
      if (error.message.includes('provider is not enabled') || error.message.includes('Unsupported provider')) {
        errorMessage = "This login method is temporarily unavailable. Please try signing in with email instead.";
        // Update provider availability
        setAvailableProviders(prev => ({ ...prev, [provider]: false }));
      }
      
      toast({
        title: "❗ Login Method Unavailable", 
        description: errorMessage,
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-pattern opacity-30"></div>
      
      <Card className="w-full max-w-md relative bg-card/95 backdrop-blur-md shadow-2xl border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Rainbow className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              PrideSphere
            </h1>
            <Sparkles className="h-6 w-6 text-accent animate-pulse" />
          </div>
          <CardDescription className="text-muted-foreground">
            Your safe, magical space to connect and celebrate 🌈
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Join Us</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full group">
                  {loading ? "Signing in..." : "Sign In"}
                  <Heart className="ml-2 h-4 w-4 group-hover:animate-pulse" />
                </Button>
              </form>

              <Button 
                variant="link" 
                onClick={handlePasswordReset} 
                className="text-sm w-full text-center"
                disabled={loading || !email}
              >
                Forgot password?
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="bg-background/50"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pronouns">Pronouns</Label>
                  <Select value={pronouns} onValueChange={setPronouns}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select your pronouns" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="they/them">they/them</SelectItem>
                      <SelectItem value="she/her">she/her</SelectItem>
                      <SelectItem value="he/him">he/him</SelectItem>
                      <SelectItem value="xe/xir">xe/xir</SelectItem>
                      <SelectItem value="ze/zir">ze/zir</SelectItem>
                      <SelectItem value="any pronouns">any pronouns</SelectItem>
                      <SelectItem value="ask my pronouns">ask my pronouns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="bg-background/50 resize-none"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full group">
                  {loading ? "Creating account..." : "🪄 Join PrideSphere"}
                  <Sparkles className="ml-2 h-4 w-4 group-hover:animate-pulse" />
                </Button>
              </form>
            </TabsContent>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {availableProviders.google && (
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={loading}
                  className="group"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
              )}
              {availableProviders.apple && (
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn('apple')}
                  disabled={loading}
                  className="group"
                >
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"/>
                    <path d="M15.53 3.83c.893-1.09 1.479-2.58 1.309-4.081-1.297.049-2.896.8-3.837 1.818-.84.96-1.557 2.502-1.365 3.976 1.448.106 2.943-.746 3.893-1.713z"/>
                  </svg>
                  Apple
                </Button>
              )}
              
              {!availableProviders.google && !availableProviders.apple && (
                <div className="col-span-2 text-center text-sm text-muted-foreground">
                  OAuth providers are temporarily unavailable. Please sign in with email.
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;