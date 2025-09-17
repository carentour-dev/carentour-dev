import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

interface PasswordRequirement {
  regex: RegExp;
  text: string;
}

const passwordRequirements: PasswordRequirement[] = [
  { regex: /.{8,}/, text: 'At least 8 characters' },
  { regex: /[A-Z]/, text: 'One uppercase letter' },
  { regex: /[a-z]/, text: 'One lowercase letter' },
  { regex: /\d/, text: 'One number' },
  { regex: /[^A-Za-z0-9]/, text: 'One special character' },
];

export const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  const { strength, requirements } = useMemo(() => {
    const metRequirements = passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(password),
    }));
    
    const metCount = metRequirements.filter(req => req.met).length;
    const strengthPercent = (metCount / passwordRequirements.length) * 100;
    
    return {
      strength: strengthPercent,
      requirements: metRequirements,
    };
  }, [password]);

  const getStrengthColor = () => {
    if (strength >= 80) return 'hsl(var(--success))';
    if (strength >= 60) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  const getStrengthText = () => {
    if (strength >= 80) return 'Strong';
    if (strength >= 60) return 'Good';
    if (strength >= 40) return 'Fair';
    if (strength > 0) return 'Weak';
    return '';
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password strength:</span>
        <span 
          className="font-medium" 
          style={{ color: getStrengthColor() }}
        >
          {getStrengthText()}
        </span>
      </div>
      
      <Progress 
        value={strength} 
        className="h-2"
        style={{
          '--progress-foreground': getStrengthColor(),
        } as React.CSSProperties}
      />
      
      <div className="space-y-1">
        {requirements.map((req, index) => (
          <div 
            key={index}
            className="flex items-center gap-2 text-xs"
          >
            {req.met ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span 
              className={req.met ? 'text-success' : 'text-muted-foreground'}
            >
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const isPasswordStrong = (password: string): boolean => {
  return passwordRequirements.every(req => req.regex.test(password));
};