import { quotationItemDetail } from "@/lib/quotation-item";
import { quotationSubtotal } from "@/domain/quotation/calculation";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Quotation } from "@/domain/quotation/models";
import { limaDate, money } from "./formatting";
const styles = StyleSheet.create({
  page: {
    padding: 35,
    paddingBottom: 55,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#111",
  },
  header: { borderBottomWidth: 1.5, paddingBottom: 16, marginBottom: 18 },
  company: { fontSize: 19, fontFamily: "Helvetica-Bold", marginBottom: 5 },
  number: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    marginTop: 17,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  tableHeader: { fontFamily: "Helvetica-Bold", backgroundColor: "#f2f2f2" },
  description: { width: "34%", paddingRight: 8 },
  measures: { width: "22%" },
  quantity: { width: "9%" },
  amount: { width: "17.5%", textAlign: "right" },
  total: {
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    marginTop: 22,
  },
  subtotal: {
    textAlign: "right",
    fontSize: 10,
    marginTop: 18,
  },
  conditions: { marginTop: 24, lineHeight: 1.5 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 35,
    right: 35,
    fontSize: 8,
    color: "#666",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
export function QuotationPdf({ quotation: q }: { quotation: Quotation }) {
  return (
    <Document title={`Proforma ${q.number}`} author="Distribuidora Araujo">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.company}>DISTRIBUIDORA ARAUJO</Text>
          <Text>Vidriería &amp; Aluminios</Text>
          <Text style={styles.number}>PROFORMA N° {q.number}</Text>
          <Text>Fecha y hora: {limaDate(q.confirmedAt)} · Moneda: Soles</Text>
        </View>
        <View style={[styles.row, styles.tableHeader]} fixed>
          <Text style={styles.description}>Vidrio / Espesor</Text>
          <Text style={styles.measures}>Modalidad / medidas</Text>
          <Text style={styles.quantity}>Cant.</Text>
          <Text style={styles.amount}>P. unitario</Text>
          <Text style={styles.amount}>Importe</Text>
        </View>
        {q.items.map((i) => (
          <View style={styles.row} key={i.id} wrap={false}>
            <Text style={styles.description}>
              {i.productDescription}
              {"\n"}
              {i.productCode}
            </Text>
            <Text style={styles.measures}>
              {quotationItemDetail(i)}
            </Text>
            <Text style={styles.quantity}>{i.quantity}</Text>
            <Text style={styles.amount}>{money(i.unitPrice)}</Text>
            <Text style={styles.amount}>{money(i.itemAmount)}</Text>
          </View>
        ))}
        <Text style={styles.subtotal}>SUBTOTAL EXACTO: {money(q.subtotal ?? quotationSubtotal(q.items))}</Text>
        <Text style={[styles.total, { marginTop: 5 }]}>TOTAL A COBRAR: {money(q.total)}</Text>
        {q.conditions && (
          <View style={styles.conditions}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              Condiciones comerciales
            </Text>
            <Text>{q.conditions}</Text>
          </View>
        )}
        <View style={styles.footer} fixed>
          <Text>Distribuidora Araujo · {q.number}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
