import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ConfirmationEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  user_email: string
}

export const ConfirmationEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_email,
}: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirm your Care N Tour account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to Care N Tour!</Heading>
        <Text style={text}>
          Thank you for signing up for Care N Tour, your trusted partner in medical tourism. 
          To complete your registration, please confirm your email address.
        </Text>
        
        <Link
          href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
          target="_blank"
          style={{
            ...button,
            display: 'block',
            marginBottom: '16px',
          }}
        >
          Confirm Your Email Address
        </Link>
        
        <Text style={{ ...text, marginBottom: '14px' }}>
          Or, copy and paste this confirmation code:
        </Text>
        <code style={code}>{token}</code>
        
        <Text style={text}>
          Once confirmed, you'll be able to:
        </Text>
        <ul style={list}>
          <li style={listItem}>Access your personalized dashboard</li>
          <li style={listItem}>Schedule consultations with top medical experts</li>
          <li style={listItem}>Plan your medical journey to Egypt</li>
          <li style={listItem}>Connect with our 24/7 support team</li>
        </ul>
        
        <Text
          style={{
            ...text,
            color: '#64748b',
            marginTop: '14px',
            marginBottom: '16px',
          }}
        >
          If you didn't create an account with Care N Tour, you can safely ignore this email.
        </Text>
        
        <Text style={footer}>
          <strong>Care N Tour Team</strong><br>
          <span style={{ color: '#64748b' }}>Your Trusted Partner in Medical Tourism</span><br>
          24/7 Emergency Hotline: +20 100 1741666<br>
          Email: info@carentour.com
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ConfirmationEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
}

const container = {
  paddingLeft: '12px',
  paddingRight: '12px',
  margin: '0 auto',
  maxWidth: '600px',
}

const h1 = {
  color: '#1e40af',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px 0',
  padding: '0',
}

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const button = {
  backgroundColor: '#1e40af',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '24px 0',
}

const list = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  paddingLeft: '20px',
}

const listItem = {
  marginBottom: '8px',
}

const footer = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '20px',
  marginTop: '32px',
  paddingTop: '20px',
  borderTop: '1px solid #e5e7eb',
  textAlign: 'center' as const,
}

const code = {
  display: 'inline-block',
  padding: '16px 24px',
  width: '90%',
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  color: '#374151',
  fontSize: '18px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  textAlign: 'center' as const,
  fontFamily: 'monospace',
}