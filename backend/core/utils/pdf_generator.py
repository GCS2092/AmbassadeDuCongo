"""
PDF Generation utilities using ReportLab (FREE)
Generate receipts, certificates, and official documents
"""
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from django.conf import settings
from datetime import datetime
import qrcode
from io import BytesIO as QRBytesIO


def generate_receipt_pdf(payment):
    """
    Generate payment receipt PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm)
    
    # Container for elements
    elements = []
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#009639'),
        alignment=TA_CENTER,
        spaceAfter=30,
    )
    
    # Title
    elements.append(Paragraph("REÇU DE PAIEMENT", title_style))
    elements.append(Spacer(1, 0.5*cm))
    
    # Embassy info
    embassy_info = [
        "Ambassade de la République du Congo",
        "Stèle Mermoz, Pyrotechnie",
        "P.O. Box 5243, Dakar, Sénégal",
        "Tél: +221 824 8398 / +221 649 3117",
    ]
    
    for line in embassy_info:
        elements.append(Paragraph(line, styles['Normal']))
    
    elements.append(Spacer(1, 1*cm))
    
    # Receipt details
    data = [
        ['Numéro de reçu:', payment.receipt_number or 'N/A'],
        ['Transaction ID:', payment.transaction_id],
        ['Date:', payment.completed_at.strftime('%d/%m/%Y %H:%M') if payment.completed_at else 'N/A'],
        ['Demande:', payment.application.reference_number],
        ['Bénéficiaire:', payment.user.get_full_name()],
        ['Méthode:', payment.get_payment_method_display()],
        ['', ''],
        ['MONTANT PAYÉ:', f"{payment.amount} {payment.currency}"],
    ]
    
    table = Table(data, colWidths=[8*cm, 8*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -2), colors.lightgrey),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#009639')),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 16),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -2), 1, colors.black),
        ('BOX', (0, -1), (-1, -1), 2, colors.HexColor('#009639')),
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 1*cm))
    
    # Footer
    elements.append(Paragraph("Ce reçu est valable comme preuve de paiement.", styles['Normal']))
    elements.append(Paragraph("Document généré automatiquement.", styles['Italic']))
    
    # Build PDF
    doc.build(elements)
    
    buffer.seek(0)
    return buffer


def generate_certificate_pdf(application):
    """
    Generate attestation certificate PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=3*cm)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#009639'),
        alignment=TA_CENTER,
        spaceAfter=20,
    )
    
    elements.append(Paragraph("ATTESTATION CONSULAIRE", title_style))
    elements.append(Spacer(1, 1*cm))
    
    # Content
    content = f"""
    <para alignment="justify">
    Le Consul de la République du Congo à Dakar atteste que
    <b>{application.applicant.get_full_name()}</b>,
    né(e) le {application.applicant.profile.date_of_birth or '[DATE]'},
    de nationalité {application.applicant.profile.get_nationality_display()},
    a déposé une demande de {application.get_application_type_display()}
    sous la référence <b>{application.reference_number}</b>.
    </para>
    """
    
    elements.append(Paragraph(content, styles['BodyText']))
    elements.append(Spacer(1, 2*cm))
    
    # Date and signature
    date_text = f"Fait à Dakar, le {datetime.now().strftime('%d/%m/%Y')}"
    elements.append(Paragraph(date_text, styles['Normal']))
    elements.append(Spacer(1, 1*cm))
    elements.append(Paragraph("Le Consul", styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer


def generate_appointment_confirmation_pdf(appointment):
    """
    Generate appointment confirmation with QR code
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#009639'),
        alignment=TA_CENTER,
        spaceAfter=20,
    )
    
    elements.append(Paragraph("CONFIRMATION DE RENDEZ-VOUS", title_style))
    elements.append(Spacer(1, 1*cm))
    
    # Appointment details
    data = [
        ['Référence:', appointment.reference_number],
        ['Service:', appointment.service_type.name],
        ['Bureau:', appointment.office.name],
        ['Date:', appointment.appointment_date.strftime('%d/%m/%Y')],
        ['Heure:', appointment.appointment_time.strftime('%H:%M')],
        ['Bénéficiaire:', appointment.user.get_full_name()],
    ]
    
    table = Table(data, colWidths=[6*cm, 10*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 1*cm))
    
    # Generate QR code with complete appointment data
    import json
    from datetime import datetime, timedelta
    
    appointment_data = {
        "type": "APPOINTMENT",
        "reference": appointment.reference_number,
        "appointment": {
            "id": str(appointment.id),
            "reference": appointment.reference_number,
            "date": appointment.appointment_date.strftime("%Y-%m-%d"),
            "time": appointment.appointment_time.strftime("%H:%M"),
            "duration": appointment.duration_minutes,
            "status": appointment.status,
            "service": {
                "id": appointment.service_type.id,
                "name": appointment.service_type.name,
                "description": appointment.service_type.description
            },
            "office": {
                "id": appointment.office.id,
                "name": appointment.office.name,
                "address": appointment.office.full_address
            },
            "user": {
                "id": str(appointment.user.id),
                "name": appointment.user.get_full_name(),
                "email": appointment.user.email,
                "role": appointment.user.role
            }
        },
        "embassy": {
            "name": "Ambassade de la République du Congo - Sénégal",
            "address": "Stèle Mermoz, Pyrotechnie, P.O. Box 5243, Dakar, Sénégal",
            "phone": "+221 824 8398",
            "email": "contact@ambassade-congo.sn"
        },
        "generatedAt": datetime.now().isoformat() + "Z",
        "validUntil": (appointment.appointment_date + timedelta(days=1)).isoformat() + "Z",
        "purpose": "Identification rendez-vous - Accès aux services consulaires"
    }
    
    qr = qrcode.QRCode(version=1, box_size=8, border=5)
    qr.add_data(json.dumps(appointment_data, ensure_ascii=False))
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Save QR to buffer
    qr_buffer = QRBytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)
    
    # Add QR code to PDF
    qr_image = Image(qr_buffer, width=5*cm, height=5*cm)
    elements.append(qr_image)
    elements.append(Spacer(1, 0.5*cm))
    
    # Instructions
    instructions = """
    <para alignment="center">
    <b>Veuillez présenter ce QR code à votre arrivée</b><br/>
    Arrivez 15 minutes avant votre rendez-vous
    </para>
    """
    elements.append(Paragraph(instructions, styles['BodyText']))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer

