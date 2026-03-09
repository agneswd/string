import { useSignUp } from '@clerk/clerk-expo'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'

import { Colors } from '../../../shared/theme'
import { formatClerkError } from '../formatClerkError'
import { authScreenStyles as styles } from './authScreenStyles'

interface SignUpScreenProps {
  onSwitchToSignIn: () => void
}

type Step = 'register' | 'verify'

export function SignUpScreen({ onSwitchToSignIn }: SignUpScreenProps) {
  const { isLoaded, signUp, setActive } = useSignUp()

  const [step, setStep] = useState<Step>('register')

  // Register step fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  // Verify step
  const [code, setCode] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const normalizedCode = code.replace(/\D/g, '').slice(0, 6)

  async function handleRegister() {
    if (!isLoaded) return
    if (!email.trim() || !password || !displayName.trim()) {
      setError('All fields are required.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await signUp.create({
        emailAddress: email.trim().toLowerCase(),
        firstName: displayName.trim(),
        password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      setStep('verify')
    } catch (err: unknown) {
      setError(formatClerkError(err, 'An unexpected error occurred. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerify() {
    if (!isLoaded) return
    if (!normalizedCode) {
      setError('Please enter the verification code.')
      return
    }
    if (normalizedCode.length !== 6) {
      setError('Verification codes must be 6 digits.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({ code: normalizedCode })

      if (signUpAttempt.status !== 'complete' || !signUpAttempt.createdSessionId) {
        setError('Verification is not complete yet. Please check the code and try again.')
        return
      }

      await setActive?.({ session: signUpAttempt.createdSessionId })
    } catch (err: unknown) {
      setError(formatClerkError(err, 'An unexpected error occurred. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'verify') {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{' '}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Verification code</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="000000"
                placeholderTextColor={Colors.textDisabled}
                value={code}
                onChangeText={(value) => {
                  setCode(value.replace(/\D/g, '').slice(0, 6))
                }}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={6}
                editable={!isSubmitting}
                returnKeyType="done"
                onSubmitEditing={handleVerify}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
              onPress={handleVerify}
              disabled={isSubmitting || !isLoaded}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.textPrimary} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Verify email</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => {
                setStep('register')
                setCode('')
                setError(null)
              }}
              disabled={isSubmitting}
            >
              <Text style={styles.switchLink}>← Back</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join String to start chatting</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Display name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={Colors.textDisabled}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="name"
              editable={!isSubmitting}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textDisabled}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!isSubmitting}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 8 characters"
              placeholderTextColor={Colors.textDisabled}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              editable={!isSubmitting}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            onPress={handleRegister}
            disabled={isSubmitting || !isLoaded}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.textPrimary} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Create account</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable onPress={onSwitchToSignIn} disabled={isSubmitting}>
            <Text style={styles.switchLink}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

