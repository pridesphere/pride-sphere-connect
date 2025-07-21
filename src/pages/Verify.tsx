import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, Upload, Shield, Users, Heart } from "lucide-react";
import { toast } from "sonner";

const Verify = () => {
  const [step, setStep] = useState(1);
  const [verificationMethod, setVerificationMethod] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    setIsSubmitted(true);
    toast.success("🪄 Verification submitted!", {
      description: "We'll review your application within 24-48 hours. Welcome to the family! ✨"
    });
  };

  if (isSubmitted) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
          <div className="w-24 h-24 bg-gradient-magical rounded-full flex items-center justify-center mx-auto animate-magical-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold pride-text">✨ Verification Submitted!</h1>
          <p className="text-lg text-muted-foreground">
            Thank you for helping us keep PrideSphere safe and authentic. 
            Our team will review your application within 24-48 hours.
          </p>
          <div className="bg-gradient-to-r from-pride-purple/10 to-pride-pink/10 p-6 rounded-xl">
            <h3 className="font-semibold mb-2">What happens next?</h3>
            <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
              <li>• We'll verify your information privately and securely</li>
              <li>• You'll receive an email confirmation</li>
              <li>• Your profile will get the verified badge ✅</li>
              <li>• You'll unlock additional community features</li>
            </ul>
          </div>
          <Button variant="magical" onClick={() => window.location.href = "/"}>
            🌈 Return to PrideSphere
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 py-6">
          <h1 className="text-3xl font-bold pride-text">🪄 Verify Your Identity</h1>
          <p className="text-lg text-muted-foreground">
            Help us keep PrideSphere safe and authentic for our LGBTQIA+ community
          </p>
        </div>

        {/* Why Verification */}
        <Card className="shadow-magical bg-gradient-to-r from-pride-purple/10 to-pride-pink/10">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-success" />
              Why we verify members
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center space-y-2">
                <Users className="w-8 h-8 text-pride-blue mx-auto" />
                <p className="font-medium">Safe Community</p>
                <p className="text-muted-foreground">Ensures our space remains exclusive to LGBTQIA+ individuals</p>
              </div>
              <div className="text-center space-y-2">
                <Shield className="w-8 h-8 text-pride-green mx-auto" />
                <p className="font-medium">Privacy First</p>
                <p className="text-muted-foreground">All verification data is encrypted and securely handled</p>
              </div>
              <div className="text-center space-y-2">
                <Heart className="w-8 h-8 text-pride-red mx-auto" />
                <p className="font-medium">Trust & Support</p>
                <p className="text-muted-foreground">Creates deeper connections through verified authenticity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Form */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Verification Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={verificationMethod} onValueChange={setVerificationMethod}>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-background-muted transition-colors">
                  <RadioGroupItem value="community" id="community" />
                  <Label htmlFor="community" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">🌈 Community Verification</p>
                      <p className="text-sm text-muted-foreground">
                        Get verified by existing trusted members who can vouch for your identity
                      </p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-background-muted transition-colors">
                  <RadioGroupItem value="social" id="social" />
                  <Label htmlFor="social" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">📱 Social Media Verification</p>
                      <p className="text-sm text-muted-foreground">
                        Link your social media profiles that demonstrate your LGBTQIA+ identity
                      </p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-background-muted transition-colors">
                  <RadioGroupItem value="document" id="document" />
                  <Label htmlFor="document" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">📄 Document Verification</p>
                      <p className="text-sm text-muted-foreground">
                        Optional: Upload supportive documents (all data encrypted & deleted after verification)
                      </p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-background-muted transition-colors">
                  <RadioGroupItem value="story" id="story" />
                  <Label htmlFor="story" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">✨ Personal Story</p>
                      <p className="text-sm text-muted-foreground">
                        Share your LGBTQIA+ journey and experience (reviewed by our community team)
                      </p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {verificationMethod === "story" && (
              <div className="space-y-4">
                <Label htmlFor="story-text">Share your story (optional)</Label>
                <Textarea
                  id="story-text"
                  placeholder="Tell us about your LGBTQIA+ journey, experiences, or what the community means to you. This helps us understand your connection to our community. (This information is kept private and secure)"
                  className="min-h-[120px]"
                />
              </div>
            )}

            {verificationMethod === "social" && (
              <div className="space-y-4">
                <Label htmlFor="social-links">Social Media Profiles</Label>
                <Input
                  id="social-links"
                  placeholder="Instagram, Twitter, TikTok, etc. (links or usernames)"
                />
              </div>
            )}

            {verificationMethod === "community" && (
              <div className="space-y-4">
                <Label htmlFor="references">Community References</Label>
                <Input
                  id="references"
                  placeholder="Usernames of PrideSphere members who can vouch for you"
                />
              </div>
            )}

            {verificationMethod === "document" && (
              <div className="space-y-4">
                <Label htmlFor="document-upload">Upload Supporting Documents (Optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Accepted: ID, medical records, organization memberships, etc.
                    (All files encrypted & deleted after verification)
                  </p>
                  <Button variant="outline" className="mt-2">Choose Files</Button>
                </div>
              </div>
            )}

            {verificationMethod && (
              <div className="pt-4">
                <Button onClick={handleSubmit} variant="magical" className="w-full">
                  🪄 Submit for Verification
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  By submitting, you confirm that the information provided is accurate and that you identify as part of the LGBTQIA+ community.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Card className="shadow-card border-success/20">
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-success" />
              Privacy & Security Commitment
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• All verification data is encrypted and securely stored</li>
              <li>• Documents are reviewed by trained, LGBTQIA+ staff members only</li>
              <li>• Personal information is deleted after verification completion</li>
              <li>• We never share or sell your verification data</li>
              <li>• You can request data deletion at any time</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Verify;