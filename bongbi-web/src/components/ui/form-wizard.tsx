import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronRight, Check, ArrowLeft, ArrowRight } from "lucide-react";

interface Step {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  isValid?: boolean;
  isOptional?: boolean;
}

interface FormWizardProps {
  steps: Step[];
  onComplete?: () => void;
  onReset?: () => void;
  className?: string;
  autoAdvance?: boolean;
}

export const FormWizard = ({ 
  steps, 
  onComplete, 
  onReset,
  className,
  autoAdvance = false 
}: FormWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isCompleted, setIsCompleted] = useState(false);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const canProceed = currentStepData?.isValid !== false;
  const canGoBack = currentStep > 0;

  const handleNext = () => {
    if (canProceed && !isLastStep) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
      
      // 마지막 단계에 도달하면 자동으로 완료 처리
      if (currentStep + 1 === steps.length - 1) {
        if (onComplete) {
          onComplete();
        }
      }
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setIsCompleted(false);
    if (onReset) {
      onReset();
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex <= currentStep || completedSteps.has(stepIndex - 1)) {
      setCurrentStep(stepIndex);
    }
  };

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Progress Indicator */}
      <div className="relative form-wizard-progress">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep;
            const isAccessible = index <= currentStep || isCompleted;

            return (
              <div key={step.id} className="flex flex-col items-center relative">
                {/* Step Circle */}
                <button
                  onClick={() => isAccessible && goToStep(index)}
                  disabled={!isAccessible}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200",
                    isCompleted
                      ? "bg-green-500 text-white shadow-lg"
                      : isCurrent
                      ? "bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20"
                      : isAccessible
                      ? "bg-white border-2 border-gray-300 text-gray-600 hover:border-primary hover:text-primary cursor-pointer"
                      : "bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Step Label */}
                <div className="mt-2 text-center max-w-24">
                  <div className={cn(
                    "text-xs font-medium",
                    isCurrent 
                      ? "text-primary" 
                      : isCompleted 
                      ? "text-green-600" 
                      : "text-gray-500"
                  )}>
                    {step.title}
                  </div>
                  {step.isOptional && (
                    <div className="text-xs text-gray-400">(선택)</div>
                  )}
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={cn(
                    "absolute top-5 left-full w-full h-0.5 -translate-y-1/2",
                    isCompleted 
                      ? "bg-green-500" 
                      : index < currentStep 
                      ? "bg-primary" 
                      : "bg-gray-200"
                  )} 
                  style={{ 
                    width: 'calc(100vw / ' + steps.length + ' - 2.5rem)',
                    left: '2.5rem'
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="min-h-[400px]">
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {currentStepData.title}
            </h2>
            {currentStepData.description && (
              <p className="text-sm text-gray-600">
                {currentStepData.description}
              </p>
            )}
          </div>

          <div className="mb-6">
            {currentStepData.content}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          이전
        </Button>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{currentStep + 1}</span>
          <span>/</span>
          <span>{steps.length}</span>
        </div>

        <Button
          onClick={isLastStep ? handleReset : handleNext}
          disabled={!isLastStep && !canProceed}
          className="flex items-center gap-2"
        >
          {isLastStep ? "새로 계산하기" : "다음"}
          {!isLastStep && <ArrowRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

// Helper component for grouping form fields
export const FormSection = ({ 
  title, 
  description, 
  children, 
  className 
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};
