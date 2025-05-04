
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BasicInfoForm } from '@/components/Profile/BasicInfoForm';
import { FitnessInfoForm } from '@/components/Profile/FitnessInfoForm';
import { DietaryInfoForm } from '@/components/Profile/DietaryInfoForm';
import { PreferencesForm } from '@/components/Profile/PreferencesForm';
import { OnboardingComplete } from '@/components/Profile/OnboardingComplete';
import { Check } from 'lucide-react';

const ProfileSetup = () => {
  const { user } = useAuth();
  const { 
    currentStep, 
    setCurrentStep, 
    isOnboardingComplete,
    saveProfileFormData,
    formData 
  } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    // If user completes onboarding elsewhere, redirect to home
    if (isOnboardingComplete) {
      navigate('/');
    }
  }, [isOnboardingComplete, navigate]);

  const handleSubmitForm = async () => {
    const { error } = await saveProfileFormData(formData);
    
    if (!error) {
      setCurrentStep('complete');
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'basic':
        return <BasicInfoForm />;
      case 'fitness':
        return <FitnessInfoForm />;
      case 'dietary':
        return <DietaryInfoForm />;
      case 'preferences':
        return <PreferencesForm />;
      case 'complete':
        return <OnboardingComplete />;
      default:
        return <BasicInfoForm />;
    }
  };

  const handleContinue = () => {
    switch (currentStep) {
      case 'basic':
        setCurrentStep('fitness');
        break;
      case 'fitness':
        setCurrentStep('dietary');
        break;
      case 'dietary':
        setCurrentStep('preferences');
        break;
      case 'preferences':
        handleSubmitForm();
        break;
      case 'complete':
        navigate('/');
        break;
      default:
        setCurrentStep('basic');
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'fitness':
        setCurrentStep('basic');
        break;
      case 'dietary':
        setCurrentStep('fitness');
        break;
      case 'preferences':
        setCurrentStep('dietary');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">
            Help us personalize your experience by providing some information about yourself.
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex justify-between">
          <Step 
            number={1} 
            title="Basic Info" 
            active={currentStep === 'basic'} 
            completed={currentStep !== 'basic' && currentStep !== 'complete'} 
          />
          <Step 
            number={2} 
            title="Fitness Profile" 
            active={currentStep === 'fitness'} 
            completed={['dietary', 'preferences'].includes(currentStep)} 
          />
          <Step 
            number={3} 
            title="Dietary Info" 
            active={currentStep === 'dietary'} 
            completed={currentStep === 'preferences'} 
          />
          <Step 
            number={4} 
            title="Preferences" 
            active={currentStep === 'preferences'} 
            completed={false} 
          />
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{getStepTitle(currentStep)}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderCurrentStep()}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          {currentStep !== 'basic' && currentStep !== 'complete' ? (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div></div>
          )}
          
          <Button 
            onClick={handleContinue}
          >
            {currentStep === 'preferences' ? 'Save Profile' : currentStep === 'complete' ? 'Go to Dashboard' : 'Continue'}
          </Button>
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>You can always update your information later in your account settings.</p>
        </div>
      </div>
    </div>
  );
};

const Step = ({ 
  number, 
  title, 
  active, 
  completed 
}: { 
  number: number; 
  title: string; 
  active: boolean; 
  completed: boolean; 
}) => {
  return (
    <div className="flex flex-col items-center">
      <div 
        className={`
          w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium 
          ${active ? 'bg-primary text-primary-foreground' : completed ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}
        `}
      >
        {completed ? <Check size={16} /> : number}
      </div>
      <span className="mt-2 text-xs text-muted-foreground">{title}</span>
    </div>
  );
};

const getStepTitle = (step: string): string => {
  switch (step) {
    case 'basic':
      return 'Basic Information';
    case 'fitness':
      return 'Fitness Profile';
    case 'dietary':
      return 'Dietary Information';
    case 'preferences':
      return 'Meal Preferences';
    case 'complete':
      return 'Profile Complete';
    default:
      return 'Complete Your Profile';
  }
};

export default ProfileSetup;
