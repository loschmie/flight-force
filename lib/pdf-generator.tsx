import React from 'react';
import ReactPDF, { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 11, color: '#333' },
  header: { marginBottom: 20 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 13, fontWeight: 'bold', color: '#666', marginBottom: 15 },
  section: { marginBottom: 10 },
  text: { marginBottom: 5, lineHeight: 1.3 },
  bold: { fontWeight: 'bold' },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  invoiceLogo: { fontSize: 24, fontWeight: 'bold', color: '#2563eb' },
  invoiceTitle: { fontSize: 24, color: '#666' },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1 solid #eee', paddingVertical: 10 },
  invoiceTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 10, borderTop: '2 solid #333', fontWeight: 'bold', fontSize: 14 }
});

export const generateDemandPDF = async (data: any) => {
  const { flightNumber, date, fullName, pnr, address, email, delayHours, to, amount, currency, bankName, iban, swift } = data;
  
  const MyDocument = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Subject: Compensation claim for flight {flightNumber} on {date}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.text}>From:</Text>
          <Text style={styles.text}>{fullName}</Text>
          <Text style={styles.text}>{address}</Text>
          <Text style={styles.text}>Email: {email}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.text}>To the Legal Department,</Text>
          <Text style={styles.text}>
            I am writing to formally request compensation for the delayed arrival of flight {flightNumber} (Booking Reference/PNR: {pnr}). The flight arrived {Math.floor(delayHours)} hours late at {to}.
          </Text>
          <Text style={styles.text}>
            According to Regulation (EC) No 261/2004 (amended 2026), I am entitled to {amount} {currency} per passenger.
          </Text>
          <Text style={styles.text}>
            Regarding your potential defenses: Be advised that per recent CJEU rulings (including 2024-2026 precedents), internal technical faults and crew shortages are part of the normal exercise of the carrier's activity and do not constitute 'extraordinary circumstances'.
          </Text>
          <Text style={styles.text}>
            I also demand an official report regarding the reason for the delay with concrete evidence from the relevant authorities, as I was verbally informed about extraordinary circumstances at the airport. Our independent verification confirms normal weather and airport operations at the time.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.text}>Please remit the payment to the following account within 14 days.</Text>
          <Text style={styles.text}>Bank Name: {bankName}</Text>
          <Text style={styles.text}>IBAN: {iban}</Text>
          <Text style={styles.text}>SWIFT/BIC: {swift}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.text}>Sincerely,</Text>
          <Text style={styles.text}>{fullName}</Text>
        </View>
      </Page>
    </Document>
  );

  return await renderToBuffer(MyDocument);
};

export const generateInvoicePDF = async (data: any) => {
  const { fullName, email, date, claimId } = data;

  const MyDocument = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.invoiceHeader}>
          <Text style={styles.invoiceLogo}>GetFlightForce</Text>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 }}>
          <View style={{ width: '50%', paddingRight: 10 }}>
            <Text style={{ color: '#666', marginBottom: 5 }}>Billed To:</Text>
            <Text style={[styles.bold, { flexWrap: 'wrap' }]}>{fullName}</Text>
            <Text style={{ flexWrap: 'wrap' }}>{email}</Text>
          </View>
          <View style={{ width: '40%', alignItems: 'flex-end' }}>
            <Text style={{ color: '#666', marginBottom: 5 }}>Invoice Details:</Text>
            <Text>Date: {date}</Text>
            <Text>Reference: {claimId.substring(0, 8)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 30 }}>
          <View style={[styles.invoiceRow, { backgroundColor: '#f8fafc', fontWeight: 'bold' }]}>
            <Text style={{ width: '70%', paddingLeft: 10 }}>Description</Text>
            <Text style={{ width: '30%', textAlign: 'right', paddingRight: 10 }}>Amount</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text style={{ width: '70%', paddingLeft: 10 }}>Automated Legal Dispatch & Data Verification Service</Text>
            <Text style={{ width: '30%', textAlign: 'right', paddingRight: 10 }}>€9.99</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text style={{ width: '70%', paddingLeft: 10 }}>Taxes (Included)</Text>
            <Text style={{ width: '30%', textAlign: 'right', paddingRight: 10 }}>€0.00</Text>
          </View>
          <View style={styles.invoiceTotal}>
            <Text style={{ paddingLeft: 10 }}>Total Paid via Stripe (Credit Card)</Text>
            <Text style={{ paddingRight: 10 }}>€9.99</Text>
          </View>
        </View>

        <View style={{ marginTop: 60, alignItems: 'center' }}>
          <Text style={{ color: '#94a3b8', fontSize: 10 }}>Thank you for trusting GetFlightForce.</Text>
          <Text style={{ color: '#94a3b8', fontSize: 10 }}>claims.verification@getflightforce.com</Text>
        </View>
      </Page>
    </Document>
  );

  return await renderToBuffer(MyDocument);
};
