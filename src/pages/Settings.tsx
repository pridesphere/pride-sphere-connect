import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Bell, Palette, User, Lock, Trash2, Globe, Users, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTheme } from "next-themes";
import Layout from "@/components/layout/Layout";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  // Settings state
  const [settings, setSettings] = useState({
    profileVisibility: "public",
    allowDMs: "everyone",
    enable2FA: false,
    newMessageAlerts: true,
    communityMentions: true,
    mentalHealthReminders: true,
    language: "en",
    accentColor: "rainbow"
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success("Setting updated!");
  };

  const handleDeleteAccount = async () => {
    // In a real app, you'd implement account deletion
    toast.error("Account deletion is not implemented yet");
  };

  const handleChangePassword = () => {
    toast.info("Password change will be implemented with auth flow");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-subtle py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold pride-text">⚙️ Pride Settings</h1>
          </div>

          <div className="grid gap-6">
            {/* Account Section */}
            <Card className="shadow-magical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  🌈 Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="p-3 bg-muted rounded-lg text-muted-foreground">
                    {user?.email || "Not available"}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <Label>Change Password</Label>
                    <p className="text-sm text-muted-foreground">Update your account password</p>
                  </div>
                  <Button variant="outline" onClick={handleChangePassword}>
                    <Lock className="w-4 h-4 mr-2" />
                    Change
                  </Button>
                </div>

                <Separator />

                <div className="flex justify-between items-center text-destructive">
                  <div>
                    <Label className="text-destructive">Delete Account</Label>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to leave the rainbow?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Yes, delete my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Safety Section */}
            <Card className="shadow-magical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  🔒 Privacy & Safety
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-muted-foreground">Who can see your profile</p>
                  </div>
                  <Select value={settings.profileVisibility} onValueChange={(value) => handleSettingChange('profileVisibility', value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Public
                        </div>
                      </SelectItem>
                      <SelectItem value="friends">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Friends Only
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <UserX className="w-4 h-4" />
                          Private
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <Label>Allow DMs</Label>
                    <p className="text-sm text-muted-foreground">Who can send you direct messages</p>
                  </div>
                  <Select value={settings.allowDMs} onValueChange={(value) => handleSettingChange('allowDMs', value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Everyone</SelectItem>
                      <SelectItem value="mutuals">Mutuals Only</SelectItem>
                      <SelectItem value="none">No One</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <Label>Enable 2FA</Label>
                    <p className="text-sm text-muted-foreground">Two-factor authentication</p>
                  </div>
                  <Switch
                    checked={settings.enable2FA}
                    onCheckedChange={(checked) => handleSettingChange('enable2FA', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notifications Section */}
            <Card className="shadow-magical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  🔔 Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Label>New Message Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new messages</p>
                  </div>
                  <Switch
                    checked={settings.newMessageAlerts}
                    onCheckedChange={(checked) => handleSettingChange('newMessageAlerts', checked)}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <Label>Community Post Mentions</Label>
                    <p className="text-sm text-muted-foreground">When someone mentions you in posts</p>
                  </div>
                  <Switch
                    checked={settings.communityMentions}
                    onCheckedChange={(checked) => handleSettingChange('communityMentions', checked)}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <Label>Mental Health Support Reminders</Label>
                    <p className="text-sm text-muted-foreground">Wellness check-ins and resources</p>
                  </div>
                  <Switch
                    checked={settings.mentalHealthReminders}
                    onCheckedChange={(checked) => handleSettingChange('mentalHealthReminders', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Interface Section */}
            <Card className="shadow-magical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  🌟 Interface
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Toggle dark/light theme</p>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <Label>Language Preference</Label>
                    <p className="text-sm text-muted-foreground">Select your preferred language</p>
                  </div>
                  <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <Label>Theme Accent Color</Label>
                    <p className="text-sm text-muted-foreground">Choose your Pride flag palette</p>
                  </div>
                  <Select value={settings.accentColor} onValueChange={(value) => handleSettingChange('accentColor', value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rainbow">🌈 Rainbow</SelectItem>
                      <SelectItem value="trans">🏳️‍⚧️ Trans</SelectItem>
                      <SelectItem value="lesbian">🧡 Lesbian</SelectItem>
                      <SelectItem value="bi">💜 Bisexual</SelectItem>
                      <SelectItem value="pan">💗 Pansexual</SelectItem>
                      <SelectItem value="ace">🖤 Asexual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center py-4 text-muted-foreground">
              <p>Powered by 🌈 Love & Safe Spaces</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;