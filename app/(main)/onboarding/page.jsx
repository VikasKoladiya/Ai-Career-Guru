"use client";

import { useState, useEffect } from "react";
import { useSearchParams, redirect } from "next/navigation";
import { industries } from "@/data/industries";
import OnboardingForm from "./_components/onboarding-form";
import { getUserOnboardingStatus } from "@/actions/user";

// Mock industries data - in real app, this would come from API/database
const INDUSTRIES_DATA = [
  {
    id: "tech",
    name: "Technology",
    subIndustries: ["Software Development", "Data Science", "Cybersecurity", "Cloud Computing", "IT Infrastructure"],
  },
  {
    id: "finance",
    name: "Finance",
    subIndustries: ["Banking", "Investment", "Insurance", "Accounting", "FinTech"],
  },
  {
    id: "healthcare",
    name: "Healthcare",
    subIndustries: ["Medicine", "Nursing", "Pharmacy", "Healthcare IT", "Biotech"],
  },
  {
    id: "marketing",
    name: "Marketing",
    subIndustries: ["Digital Marketing", "Content Marketing", "Brand Management", "Market Research", "Social Media"],
  },
];

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('mode') === 'edit';
  
  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!isEditMode) {
        // Only check onboarding status and redirect for non-edit mode
        try {
          const { isOnboarded } = await getUserOnboardingStatus();
          
          if (isOnboarded) {
            setShouldRedirect(true);
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
        }
      }
      setIsLoading(false);
    }
    
    checkOnboardingStatus();
  }, [isEditMode]);
  
  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = "/dashboard";
    }
  }, [shouldRedirect]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <OnboardingForm industries={industries} />
    </div>
  );
}
