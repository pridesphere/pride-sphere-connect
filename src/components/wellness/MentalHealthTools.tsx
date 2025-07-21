import { useState } from "react";
import { Heart, Sparkles, Moon, Sun, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const MentalHealthTools = () => {
  const [currentMood, setCurrentMood] = useState<string>("");
  const [affirmationIndex, setAffirmationIndex] = useState(0);

  const dailyAffirmations = [
    "You're valid and loved exactly as you are 💖",
    "Your identity is beautiful and worthy of celebration 🌈",
    "You belong in this world and deserve happiness ✨",
    "Your journey is unique and that makes you magical 🦄",
    "You are enough, you are loved, you are important 💫",
    "Your authentic self is your greatest gift 🎁",
    "You deserve respect, love, and acceptance 🌟"
  ];

  const moodOptions = [
    { emoji: "😊", label: "Happy", color: "pride-yellow" },
    { emoji: "😌", label: "Peaceful", color: "pride-blue" },
    { emoji: "😔", label: "Sad", color: "pride-purple" },
    { emoji: "😰", label: "Anxious", color: "pride-orange" },
    { emoji: "😡", label: "Angry", color: "pride-red" },
    { emoji: "🤗", label: "Grateful", color: "pride-green" },
    { emoji: "😴", label: "Tired", color: "muted" },
    { emoji: "✨", label: "Magical", color: "pride-pink" }
  ];

  const resources = [
    {
      name: "The Trevor Project",
      description: "24/7 crisis support for LGBTQ+ youth",
      phone: "1-866-488-7386",
      type: "Crisis Hotline"
    },
    {
      name: "Trans Lifeline",
      description: "Peer support for transgender people",
      phone: "877-565-8860",
      type: "Support Line"
    },
    {
      name: "LGBT National Hotline",
      description: "Information and local resources",
      phone: "1-888-843-4564",
      type: "Information"
    }
  ];

  const handleMoodTrack = (mood: string) => {
    setCurrentMood(mood);
    toast.success("✨ Mood tracked!", {
      description: "Thank you for checking in with yourself today."
    });
  };

  const getNewAffirmation = () => {
    const newIndex = (affirmationIndex + 1) % dailyAffirmations.length;
    setAffirmationIndex(newIndex);
    toast.success("💖 New affirmation!", {
      description: "A magical reminder just for you."
    });
  };

  return (
    <div className="space-y-6">
      {/* Daily Affirmation */}
      <Card className="shadow-magical bg-gradient-to-br from-pride-purple/10 to-pride-pink/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pride-purple" />
            Daily Affirmation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-lg font-medium text-foreground p-4 bg-card rounded-lg shadow-card">
              "{dailyAffirmations[affirmationIndex]}"
            </p>
            <Button onClick={getNewAffirmation} variant="magical">
              ✨ New Magical Reminder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mood Tracker */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pride-red" />
            ✨ Check Your Vibes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              How are you feeling right now? Your emotions are valid. 💖
            </p>
            <div className="grid grid-cols-4 gap-3">
              {moodOptions.map((mood) => (
                <Button
                  key={mood.label}
                  variant={currentMood === mood.label ? "magical" : "outline"}
                  className={`flex flex-col items-center p-4 h-auto ${
                    currentMood === mood.label ? "shadow-glow" : ""
                  }`}
                  onClick={() => handleMoodTrack(mood.label)}
                >
                  <span className="text-2xl mb-1">{mood.emoji}</span>
                  <span className="text-xs">{mood.label}</span>
                </Button>
              ))}
            </div>
            {currentMood && (
              <div className="mt-4 p-3 bg-background-muted rounded-lg">
                <p className="text-sm">
                  You're feeling <strong>{currentMood}</strong> today. 
                  Remember that all feelings are temporary and valid. 🌈
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Wellness Activities */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-pride-yellow" />
            Quick Wellness Break
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="float" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Moon className="w-6 h-6" />
              <span className="font-medium">3-Minute Meditation</span>
              <span className="text-xs text-muted-foreground text-center">
                Guided breathing for inner peace
              </span>
            </Button>
            <Button variant="connection" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Sparkles className="w-6 h-6" />
              <span className="font-medium">Self-Love Exercise</span>
              <span className="text-xs text-muted-foreground text-center">
                Practice affirmations and gratitude
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Crisis Resources */}
      <Card className="shadow-card border-success/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-success" />
            LGBTQIA+ Support Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You're not alone. These resources are here for you 24/7. 🤗
            </p>
            {resources.map((resource) => (
              <div key={resource.name} className="p-4 bg-background-muted rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{resource.name}</h4>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                  <Badge variant="outline">{resource.type}</Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <Button variant="verify" size="sm">
                    <Phone className="w-4 h-4 mr-2" />
                    {resource.phone}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat Online
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MentalHealthTools;