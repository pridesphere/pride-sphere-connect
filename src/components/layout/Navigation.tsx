
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu, MessageCircle, Heart, Users, Sparkles, Moon, Sun, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useNotifications } from "@/hooks/useNotifications";
import { useMessages } from "@/hooks/useMessages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { unreadCount: notificationUnreadCount } = useNotifications();
  const { unreadCount: messageUnreadCount } = useMessages();

  const getUserInitials = () => {
    if (profile?.display_name) {
      return profile.display_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return "🏳️‍🌈";
  };

  const navItems = [
    { label: "Home", path: "/", icon: Heart, color: "pride-red" },
    { label: "Communities", path: "/communities", icon: Users, color: "pride-blue" },
    { label: "Messages", path: "/messages", icon: MessageCircle, color: "pride-purple", badgeCount: messageUnreadCount },
    { label: "Mental Health", path: "/wellness", icon: Sparkles, color: "pride-pink" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-magical rounded-lg flex items-center justify-center group-hover:animate-magical-bounce">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold pride-text">PrideSphere</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="🔍 Smart Search friends, communities, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 magical-border focus:shadow-glow rounded-full"
            />
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "magical" : "ghost"}
                    size="sm"
                    className="relative"
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                    {item.badgeCount && item.badgeCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-pride-red border-0 text-white">
                        {item.badgeCount > 9 ? '9+' : item.badgeCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => navigate('/notifications')}
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {notificationUnreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-pride-red border-0 text-white">
                  {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="User menu">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-pride text-white font-semibold text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <Link to="/profile" className="flex items-center w-full">
                    View Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/profile/edit" className="flex items-center w-full">
                    Edit ✨ Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/settings" className="flex items-center w-full">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/verify" className="flex items-center w-full">
                    🪄 Verify Me
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => signOut()}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Mobile menu">
                    <Menu className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {navItems.map((item) => (
                    <DropdownMenuItem key={item.path}>
                      <Link to={item.path} className="flex items-center w-full">
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.label}
                        {item.badgeCount && item.badgeCount > 0 && (
                          <Badge className="ml-auto w-5 h-5 text-xs bg-pride-red border-0 text-white">
                            {item.badgeCount > 9 ? '9+' : item.badgeCount}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
