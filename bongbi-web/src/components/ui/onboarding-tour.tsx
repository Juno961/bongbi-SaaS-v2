import { useState, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { X, ArrowRight, ArrowLeft, Lightbulb, Target } from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  content: ReactNode;
  target?: string; // CSS selector for target element
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; // Optional action to perform when step is shown
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  showProgress?: boolean;
  className?: string;
}

export const OnboardingTour = ({
  steps,
  isOpen,
  onClose,
  onComplete,
  showProgress = true,
  className
}: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Find and highlight target element
  useEffect(() => {
    if (isOpen && currentStepData?.target) {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        // Add highlight class
        element.classList.add('onboarding-highlight');
        // Scroll into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Execute action if provided
        if (currentStepData.action) {
          setTimeout(currentStepData.action, 300);
        }
      }
    }

    return () => {
      // Remove highlight from previous element
      if (targetElement) {
        targetElement.classList.remove('onboarding-highlight');
      }
    };
  }, [currentStep, isOpen, currentStepData]);

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Remove highlight
    if (targetElement) {
      targetElement.classList.remove('onboarding-highlight');
    }
    
    // Mark tour as completed
    localStorage.setItem('onboarding-completed', 'true');
    
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  const handleSkip = () => {
    // Mark tour as skipped
    localStorage.setItem('onboarding-completed', 'true');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-50 backdrop-blur-[1px]" />
      
      {/* Tour Card */}
      <div className={cn(
        "fixed z-50 w-80 max-w-[90vw]",
        currentStepData?.position === 'center' && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
        !currentStepData?.position && "top-4 right-4",
        className
      )}>
        <Card className="shadow-2xl border-primary">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  {currentStepData.title}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="mb-6 text-sm text-gray-600">
              {currentStepData.content}
            </div>

            {/* Progress */}
            {showProgress && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>진행률</span>
                  <span>{currentStep + 1} / {steps.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={isFirstStep}
                className="text-gray-500"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                이전
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-gray-500"
              >
                건너뛰기
              </Button>

              <Button
                size="sm"
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90"
              >
                {isLastStep ? '완료' : '다음'}
                {!isLastStep && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

// Welcome guide component for empty states
export const WelcomeGuide = ({ 
  children, 
  className,
  title = "시작하기",
  description = "봉비서를 처음 사용하시나요? 간단한 가이드를 따라해보세요."
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) => {
  return (
    <Card className={cn("border-dashed border-2 border-primary/30 bg-primary/5", className)}>
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="w-8 h-8 text-primary" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-6">
          {description}
        </p>

        <div className="space-y-3">
          {children}
        </div>
      </CardContent>
    </Card>
  );
};

// Step component for WelcomeGuide
export const GuideStep = ({ 
  number, 
  title, 
  description,
  action,
  className 
}: {
  number: number;
  title: string;
  description?: string;
  action?: () => void;
  className?: string;
}) => {
  return (
    <div className={cn("flex items-start gap-3 text-left", className)}>
      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <div className="font-medium text-gray-900 text-sm">{title}</div>
        {description && (
          <div className="text-xs text-gray-600 mt-0.5">{description}</div>
        )}
        {action && (
          <Button
            variant="link"
            size="sm"
            onClick={action}
            className="p-0 h-auto text-primary text-xs mt-1"
          >
            바로가기 →
          </Button>
        )}
      </div>
    </div>
  );
};
