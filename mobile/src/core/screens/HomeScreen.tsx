import { StyleSheet, Text, View } from 'react-native'

export function HomeScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>STRING MOBILE</Text>
      <Text style={styles.title}>Expo client scaffolded.</Text>
      <Text style={styles.body}>
        Next step: connect shared app logic, auth, DM list, and call flows incrementally.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#0f1117',
  },
  eyebrow: {
    color: '#7a8495',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  title: {
    color: '#f4f7fb',
    fontSize: 28,
    fontWeight: '700',
  },
  body: {
    color: '#b3bccb',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 360,
  },
})
