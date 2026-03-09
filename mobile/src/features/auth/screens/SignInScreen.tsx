import { useSignIn } from '@clerk/clerk-expo'
import type { EmailCodeFactor } from '@clerk/types'
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

interface SignInScreenProps {
  onSwitchToSignUp: () => void
}

type Step = 'credentials' | 'verify'

interface SignInAttemptLike {
  status?: string | null
  supportedFirstFactors?: Array<{ strategy?: string | null }> | null
  supportedSecondFactors?: Array<{ strategy?: string | null }> | null
}

function describeUnsupportedSignInAttempt(signInAttempt: SignInAttemptLike) {
  const firstFactors = signInAttempt.supportedFirstFactors
    ?.map((factor) => factor.strategy?.trim())
    .filter((value): value is string => Boolean(value))
    .join(', ')

  const secondFactors = signInAttempt.supportedSecondFactors
    ?.map((factor) => factor.strategy?.trim())
    .filter((value): value is string => Boolean(value))
    .join(', ')

  const details = [
    signInAttempt.status ? `status: ${signInAttempt.status}` : null,
    firstFactors ? `first factors: ${firstFactors}` : null,
    secondFactors ? `second factors: ${secondFactors}` : null,
  ].filter((value): value is string => Boolean(value))

  return details.length > 0
    ? `This sign-in requires another Clerk step (${details.join(' · ')}).`
    : 'This sign-in requires a verification step that this screen does not support yet.'
}

export function SignInScreen({ onSwitchToSignUp }: SignInScreenProps) {
  const { isLoaded, signIn, setActive } = useSignIn()

  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const normalizedCode = code.replace(/\D/g, '').slice(0, 6)

  async function handleSubmit() {
    if (!isLoaded) return
    if (!email.trim() || !password) {
      setError('Email and password are required.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const signInAttempt = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password,
      })
      const signInStatus = signInAttempt.status as string | null

      if (signInStatus === 'complete' && signInAttempt.createdSessionId) {
        await setActive?.({ session: signInAttempt.createdSessionId })
        return
      }

      if (signInStatus === 'needs_second_factor' || signInStatus === 'needs_client_trust') {
        const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
          (factor): factor is EmailCodeFactor => factor.strategy === 'email_code',
        )

        if (emailCodeFactor) {
          await signIn.prepareSecondFactor({
            strategy: 'email_code',
            emailAddressId: emailCodeFactor.emailAddressId,
          })

          setVerificationEmail(emailCodeFactor.safeIdentifier ?? email.trim().toLowerCase())
          setCode('')
          setStep('verify')
          return
        }
      }

      setError(describeUnsupportedSignInAttempt(signInAttempt))
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
      const signInAttempt = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code: normalizedCode,
      })

      if (signInAttempt.status !== 'complete' || !signInAttempt.createdSessionId) {
        setError('Verification is not complete yet. Please check the code and try again.')
        return
      }

      await setActive?.({ session: signInAttempt.createdSessionId })
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
            <Text style={styles.title}>Verify your sign-in</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{' '}
              <Text style={styles.emailHighlight}>{verificationEmail ?? email}</Text>
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
                <Text style={styles.primaryButtonText}>Verify and sign in</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => {
                setStep('credentials')
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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue to String</Text>
        </View>

        <View style={styles.form}>
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
              placeholder="••••••••"
              placeholderTextColor={Colors.textDisabled}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              editable={!isSubmitting}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || !isLoaded}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.textPrimary} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign in</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Pressable onPress={onSwitchToSignUp} disabled={isSubmitting}>
            <Text style={styles.switchLink}>Create one</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

