"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import { onboardingSchema } from "@/app/lib/schema";
import { updateUser, getUserDetailsForEdit } from "@/actions/user";

const OnboardingForm = ({ industries, initialUserData = null }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get('mode') === 'edit';
  const returnTo = searchParams.get('returnTo') || '/dashboard';
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [loadingUserData, setLoadingUserData] = useState(false);

  const {
    loading: updateLoading,
    fn: updateUserFn,
    data: updateResult,
  } = useFetch(updateUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(onboardingSchema),
  });

  // Load user data if in edit mode
  useEffect(() => {
    const fetchUserData = async () => {
      // Log the return path for debugging
      console.log("Return path after saving:", returnTo);
      
      if (isEditing && !initialUserData) {
        try {
          setLoadingUserData(true);
          const userData = await getUserDetailsForEdit();
          
          // Set form values with user data
          setValue("industry", userData.mainIndustry);
          setValue("subIndustry", userData.subIndustry);
          setValue("experience", userData.experience);
          setValue("skills", userData.skills);
          setValue("bio", userData.bio);
          
          // Set selected industry to show sub-industries
          const industry = industries.find(ind => ind.id === userData.mainIndustry);
          setSelectedIndustry(industry);
          
          setLoadingUserData(false);
        } catch (error) {
          console.error("Error loading user data:", error);
          toast.error("Failed to load your profile data");
          setLoadingUserData(false);
        }
      } else if (initialUserData) {
        // If initial data is passed directly
        setValue("industry", initialUserData.mainIndustry);
        setValue("subIndustry", initialUserData.subIndustry);
        setValue("experience", initialUserData.experience);
        setValue("skills", initialUserData.skills);
        setValue("bio", initialUserData.bio);
        
        const industry = industries.find(ind => ind.id === initialUserData.mainIndustry);
        setSelectedIndustry(industry);
      }
    };
    
    fetchUserData();
  }, [isEditing, initialUserData, industries, setValue, returnTo]);

  const onSubmit = async (values) => {
    try {
      if (!values.industry || !values.subIndustry) {
        toast.error("Please select both industry and specialization");
        return;
      }
      
      const formattedIndustry = `${values.industry}-${values.subIndustry
        .toLowerCase()
        .replace(/ /g, "-")}`;

      console.log("Submitting with returnTo:", returnTo);

      // Call the update function
      const result = await updateUserFn({
        ...values,
        industry: formattedIndustry,
        returnTo: returnTo || "/dashboard",
      });
      
      console.log("Update result:", result);
      
      // Show success message
      toast.success(isEditing ? "Profile updated successfully!" : "Profile completed successfully!");
      
      // Use the redirectTo from the result if available, otherwise use returnTo or default to dashboard
      const redirectPath = (result && result.redirectTo) ? result.redirectTo : (returnTo || "/dashboard");
      console.log("Redirecting to:", redirectPath);
      
      // Directly redirect for immediate navigation
      window.location.replace(redirectPath);
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Failed to update profile. Please try again.");
    }
  };

  const watchIndustry = watch("industry");

  return (
    <div className="flex items-center justify-center bg-background">
      <Card className="w-full max-w-lg mt-10 mx-2">
        <CardHeader>
          <CardTitle className="gradient-title text-4xl">
            {isEditing ? "Edit Your Profile" : "Complete Your Profile"}
          </CardTitle>
          <CardDescription>
            {isEditing 
              ? "Update your industry and skills to get better career insights."
              : "Select your industry to get personalized career insights and recommendations."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUserData ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading your profile...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  onValueChange={(value) => {
                    setValue("industry", value);
                    setSelectedIndustry(
                      industries.find((ind) => ind.id === value)
                    );
                    setValue("subIndustry", "");
                  }}
                  defaultValue={watchIndustry}
                >
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select an industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Industries</SelectLabel>
                      {industries.map((ind) => (
                        <SelectItem key={ind.id} value={ind.id}>
                          {ind.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.industry && (
                  <p className="text-sm text-red-500">
                    {errors.industry.message}
                  </p>
                )}
              </div>

              {watchIndustry && (
                <div className="space-y-2">
                  <Label htmlFor="subIndustry">Specialization</Label>
                  <Select
                    onValueChange={(value) => setValue("subIndustry", value)}
                    defaultValue={watch("subIndustry")}
                  >
                    <SelectTrigger id="subIndustry">
                      <SelectValue placeholder="Select your specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Specializations</SelectLabel>
                        {selectedIndustry?.subIndustries.map((sub) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.subIndustry && (
                    <p className="text-sm text-red-500">
                      {errors.subIndustry.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  placeholder="Enter years of experience"
                  {...register("experience")}
                />
                {errors.experience && (
                  <p className="text-sm text-red-500">
                    {errors.experience.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills</Label>
                <Input
                  id="skills"
                  placeholder="e.g., Python, JavaScript, Project Management"
                  {...register("skills")}
                />
                <p className="text-sm text-muted-foreground">
                  Separate multiple skills with commas
                </p>
                {errors.skills && (
                  <p className="text-sm text-red-500">{errors.skills.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about your professional background..."
                  className="h-32"
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-sm text-red-500">{errors.bio.message}</p>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => window.location.replace(returnTo || "/dashboard")}
                  disabled={updateLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateLoading || !selectedIndustry}>
                  {updateLoading ? (
                    <div className="flex items-center space-x-2">
                      <span className="animate-spin">
                        <Loader2 className="h-4 w-4" />
                      </span>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingForm;
