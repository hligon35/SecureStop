import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Divider, HelperText, ProgressBar, Text, TextInput, useTheme } from 'react-native-paper';

export type PasswordValidation = {
  hasMinLen: boolean;
  hasCapital: boolean;
  hasSpecial: boolean;
  meetsAll: boolean;
  metCount: number;
  strength: number;
};

export function validatePassword(password: string): PasswordValidation {
  const hasMinLen = password.length >= 8;
  const hasCapital = /[A-Z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const metCount = [hasMinLen, hasCapital, hasSpecial].filter(Boolean).length;
  const strength = metCount / 3;
  return {
    hasMinLen,
    hasCapital,
    hasSpecial,
    meetsAll: hasMinLen && hasCapital && hasSpecial,
    metCount,
    strength,
  };
}

export function PasswordFields(props: {
  password: string;
  confirmPassword: string;
  onChangePassword: (v: string) => void;
  onChangeConfirmPassword: (v: string) => void;
  editable: boolean;
  hideDivider?: boolean;
}) {
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validation = useMemo(() => validatePassword(props.password), [props.password]);
  const isChanging = props.password.trim().length > 0 || props.confirmPassword.trim().length > 0;
  const confirmMatches = props.password === props.confirmPassword;

  const showConfirmError = props.confirmPassword.length > 0 && !confirmMatches;
  const showStrength = props.password.length > 0;

  return (
    <View style={{ gap: 10 }}>
      {props.hideDivider ? null : <Divider style={{ opacity: 0.25 }} />}

      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        Password
      </Text>

      <TextInput
        label="Password"
        value={props.password}
        secureTextEntry={!showPassword}
        editable={props.editable}
        onChangeText={props.onChangePassword}
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off' : 'eye'}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            onPress={() => setShowPassword((v) => !v)}
            disabled={!props.editable}
          />
        }
      />

      <TextInput
        label="Confirm password"
        value={props.confirmPassword}
        secureTextEntry={!showConfirmPassword}
        editable={props.editable}
        onChangeText={props.onChangeConfirmPassword}
        right={
          <TextInput.Icon
            icon={showConfirmPassword ? 'eye-off' : 'eye'}
            accessibilityLabel={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
            onPress={() => setShowConfirmPassword((v) => !v)}
            disabled={!props.editable}
          />
        }
      />

      {showConfirmError ? <HelperText type="error">Passwords do not match.</HelperText> : null}

      {showStrength ? (
        <View style={{ gap: 6 }}>
          <Text variant="labelSmall">Password strength</Text>
          <ProgressBar progress={validation.strength} />
          <Text variant="labelSmall">{validation.hasCapital ? '✓' : '•'} 1 capital letter</Text>
          <Text variant="labelSmall">{validation.hasSpecial ? '✓' : '•'} 1 special character</Text>
          <Text variant="labelSmall">{validation.hasMinLen ? '✓' : '•'} 8+ characters</Text>
          {isChanging && (!validation.meetsAll || !confirmMatches) ? (
            <HelperText type="error">
              Password must be 8+ chars, include 1 capital, 1 special, and match confirmation.
            </HelperText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
