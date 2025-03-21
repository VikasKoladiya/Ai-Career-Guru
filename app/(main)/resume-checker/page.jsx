"use client";

import React, { useState } from 'react';
import { Upload, FileX, CheckCircle2, AlertCircle, PercentIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

function ResumeCheckerPage() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast.error("Please upload a PDF file");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("Please select a PDF resume to upload");
      return;
    }

    if (!jobDescription.trim()) {
      toast.error("Please enter a job description");
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create FormData to send files
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', jobDescription);
      
      // Upload the resume and job description
      setTimeout(async () => {
        setIsUploading(false);
        setIsAnalyzing(true);
        
        try {
          // Try to use the Express API endpoint
          let analysisResult;
          
          try {
            // Attempt to connect to the ATS server
            const response = await fetch(`${process.env.NEXT_PUBLIC_ATS_SERVER_URL || 'http://localhost:5000'}/upload`, {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error('Failed to analyze resume');
            }
            
            analysisResult = await response.json();
          } catch (serverError) {
            console.warn("ATS Server not available, falling back to mock analysis:", serverError);
            
            // Fallback to mock analysis when server is not available
            analysisResult = generateMockAnalysis(jobDescription);
            
            // Notify user this is a mock response
            toast.info("Using mock analysis (ATS server not available)");
          }
          
          // Format the data for your UI
          const score = typeof analysisResult["JD Match"] === 'string' 
            ? parseInt(analysisResult["JD Match"].replace('%', ''))
            : analysisResult["JD Match"];
          
          setResult({
            score: score,
            feedback: [
              `Your resume is a ${score}% match with the job description`, 
              "Analysis completed successfully"
            ],
            keywordMatches: [], 
            missingKeywords: analysisResult["MissingKeywords"],
            improvementSuggestions: [analysisResult["Profile Summary"]],
            summaryText: analysisResult["Profile Summary"]
          });
          
          toast.success("Your resume has been analyzed successfully");
        } catch (error) {
          console.error("Error analyzing resume:", error);
          toast.error("Failed to analyze resume: " + error.message);
        } finally {
          setIsAnalyzing(false);
        }
      }, 1500);
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast.error("Error: " + error.message);
      setIsUploading(false);
    }
  };

  // Fallback mock analysis function
  const generateMockAnalysis = (jobDescription) => {
    const keywords = [
      "React", "JavaScript", "TypeScript", "Node.js", "Express", "Next.js", 
      "API", "frontend", "backend", "full-stack", "responsive", "UI/UX",
      "database", "SQL", "NoSQL", "MongoDB", "testing", "Git", "Agile"
    ];
    
    // Generate a variable score based on job description length
    const baseScore = 65 + Math.floor(Math.random() * 20);
    
    // Generate missing keywords (3-6 random keywords)
    const missingCount = 3 + Math.floor(Math.random() * 4);
    const shuffled = [...keywords].sort(() => 0.5 - Math.random());
    const missingKeywords = shuffled.slice(0, missingCount);
    
    return {
      "JD Match": `${baseScore}%`,
      "MissingKeywords": missingKeywords,
      "Profile Summary": `Based on your resume, you appear to have experience with several key skills mentioned in the job description. However, to increase your chances of getting past the ATS, consider adding more specific details about ${missingKeywords.slice(0, 3).join(', ')} and other technical skills mentioned in the job posting. Quantify your achievements with metrics where possible, and tailor your resume to highlight the most relevant experience for this specific position.`
    };
  };

  const resetForm = () => {
    setFile(null);
    setJobDescription('');
    setResult(null);
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 md:px-8">
      <h1 className="text-2xl font-bold mb-4 sm:mb-6">Resume ATS Analyzer</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div>
          {/* File Upload Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Upload Your Resume</CardTitle>
              <CardDescription>
                Upload your resume and provide a job description to check ATS compatibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer bg-white hover:bg-gray-50/20 transition-all hover:scale-[1.02] duration-300">
                  <input
                    type="file"
                    id="resume-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="application/pdf"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer block w-full">
                    {!file ? (
                      <>
                        <Upload className="h-10 w-10 mx-auto text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">PDF (max 5MB)</p>
                      </>
                    ) : (
                      <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="bg-green-50 p-2 rounded-md flex-shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          </div>
                          <div className="ml-3 text-left truncate flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white hover:bg-red-50 hover:text-red-500 border border-gray-200 text-gray-500 transition-all hover:scale-110 duration-200"
                            onClick={(e) => {
                              e.preventDefault();
                              setFile(null);
                            }}
                          >
                            <FileX className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <label className="text-sm font-medium" htmlFor="job-description">
                    Job Description
                  </label>
                  <Textarea
                    id="job-description"
                    placeholder="Paste the job description here to match against your resume..."
                    className="h-24 sm:h-32"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    A more detailed job description will yield better results
                  </p>
                </div>

                {(isUploading || isAnalyzing) && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>
                        {isUploading ? "Uploading..." : "Analyzing resume..."}
                      </span>
                      <span>
                        {isUploading ? "Step 1/2" : "Step 2/2"}
                      </span>
                    </div>
                    <Progress value={isUploading ? 40 : 80} />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!file || isUploading || isAnalyzing || !jobDescription.trim()}
                  >
                    {isUploading
                      ? "Uploading..."
                      : isAnalyzing
                      ? "Analyzing..."
                      : "Analyze Resume"}
                  </Button>
                  
                  {result && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={resetForm}
                    >
                      New Analysis
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Results Section */}
        <div>
          {result ? (
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>ATS Match Score:</span>
                  <span className={`font-bold ${
                    result.score >= 80 
                      ? "text-green-500" 
                      : result.score >= 60 
                      ? "text-yellow-500" 
                      : "text-red-500"
                  }`}>
                    {result.score}%
                  </span>
                </CardTitle>
                <CardDescription>
                  How well your resume matches this specific job description
                </CardDescription>
                <div className="mt-2">
                  <div className={cn(
                    "relative h-2 w-full overflow-hidden rounded-full bg-primary/20"
                  )}>
                    <div 
                      className={cn(
                        "h-full w-full flex-1 transition-all absolute top-0 left-0",
                        result.score >= 80 
                          ? "bg-green-500" 
                          : result.score >= 60 
                          ? "bg-yellow-500" 
                          : "bg-red-500"
                      )}
                      style={{ transform: `translateX(-${100 - (result.score || 0)}%)` }} 
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Profile Summary */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Profile Summary</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {result.summaryText}
                  </p>
                </div>
                
                {/* Missing Keywords */}
                {result.missingKeywords.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span>Missing Keywords</span>
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {result.missingKeywords.map((keyword, i) => (
                        <Badge key={i} variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Improvement Suggestions */}
                {result.improvementSuggestions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                      </svg>
                      <span>Suggestions for Improvement</span>
                    </h3>
                    <ul className="text-sm space-y-1 pl-6 list-disc">
                      <li>Add the missing keywords to your resume where applicable</li>
                      <li>Tailor your experience section to better match this job</li>
                      <li>Update your skills section to highlight relevant technologies</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg p-4 sm:p-8 text-center text-gray-500">
              <div>
                <AlertCircle className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                <p className="text-sm">
                  Upload your resume and provide a job description for analysis
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResumeCheckerPage;