import { jsPDF } from "jspdf";
import type { ResumeData } from "./resume-types";

// Professional single-template PDF with a dark red sidebar.
export function generateResumePdf(d: ResumeData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const SIDEBAR_W = 200;
  const RED: [number, number, number] = [180, 25, 30];
  const DARK: [number, number, number] = [25, 25, 28];
  const LIGHT: [number, number, number] = [245, 245, 245];
  const MUTED: [number, number, number] = [200, 200, 200];

  // ---------- Sidebar ----------
  doc.setFillColor(...DARK);
  doc.rect(0, 0, SIDEBAR_W, H, "F");
  doc.setFillColor(...RED);
  doc.rect(0, 0, 6, H, "F");

  let sy = 40;

  // Photo
  if (d.fotoDataUrl) {
    try {
      const size = 130;
      const cx = SIDEBAR_W / 2;
      // white circle behind
      doc.setFillColor(255, 255, 255);
      doc.circle(cx, sy + size / 2, size / 2 + 4, "F");
      doc.addImage(d.fotoDataUrl, "JPEG", cx - size / 2, sy, size, size);
      sy += size + 30;
    } catch {
      sy += 10;
    }
  }

  const sidebarSection = (title: string) => {
    doc.setTextColor(...RED);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title.toUpperCase(), 20, sy);
    sy += 6;
    doc.setDrawColor(...RED);
    doc.setLineWidth(1.2);
    doc.line(20, sy, SIDEBAR_W - 20, sy);
    sy += 14;
  };

  const sidebarText = (text: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9);
    doc.setTextColor(...LIGHT);
    const lines = doc.splitTextToSize(text, SIDEBAR_W - 40);
    doc.text(lines, 20, sy);
    sy += lines.length * 11;
  };

  // Contact
  if (d.email || d.telefone || d.cidade) {
    sidebarSection("Contato");
    if (d.telefone) {
      sidebarText(d.telefone);
      sy += 4;
    }
    if (d.email) {
      sidebarText(d.email);
      sy += 4;
    }
    if (d.cidade) {
      sidebarText(d.cidade);
      sy += 4;
    }
    sy += 12;
  }

  if (d.habilidades.length) {
    sidebarSection("Habilidades");
    d.habilidades
      .filter((h) => h.trim())
      .forEach((h) => {
        doc.setFillColor(...RED);
        doc.circle(24, sy - 3, 1.6, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...LIGHT);
        const lines = doc.splitTextToSize(h, SIDEBAR_W - 50);
        doc.text(lines, 32, sy);
        sy += lines.length * 12 + 2;
      });
    sy += 10;
  }

  if (d.idiomas.length) {
    sidebarSection("Idiomas");
    d.idiomas
      .filter((i) => i.trim())
      .forEach((i) => {
        doc.setFillColor(...RED);
        doc.circle(24, sy - 3, 1.6, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...LIGHT);
        doc.text(i, 32, sy);
        sy += 14;
      });
  }

  // ---------- Main column ----------
  const M = SIDEBAR_W + 30;
  const MW = W - M - 30;
  let my = 50;

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...DARK);
  const nameLines = doc.splitTextToSize(d.nome || "Seu Nome", MW);
  doc.text(nameLines, M, my);
  my += nameLines.length * 28;

  // Profession
  if (d.profissao) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.setTextColor(...RED);
    doc.text(d.profissao.toUpperCase(), M, my);
    my += 18;
  }

  // Divider
  doc.setDrawColor(...RED);
  doc.setLineWidth(2);
  doc.line(M, my, M + 60, my);
  my += 18;

  const mainSection = (title: string) => {
    if (my > H - 80) {
      doc.addPage();
      my = 50;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...RED);
    doc.text(title.toUpperCase(), M, my);
    my += 6;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.8);
    doc.line(M, my, M + MW, my);
    my += 16;
  };

  if (d.resumo) {
    mainSection("Perfil Profissional");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(d.resumo, MW);
    doc.text(lines, M, my);
    my += lines.length * 13 + 14;
  }

  if (d.experiencias.length) {
    mainSection("Experiência Profissional");
    d.experiencias
      .filter((e) => e.cargo || e.empresa)
      .forEach((e) => {
        if (my > H - 90) {
          doc.addPage();
          my = 50;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...DARK);
        doc.text(e.cargo || "", M, my);
        my += 14;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...RED);
        const meta = [e.empresa, e.periodo].filter(Boolean).join(" • ");
        if (meta) {
          doc.text(meta, M, my);
          my += 13;
        }

        if (e.descricao) {
          doc.setTextColor(70, 70, 70);
          doc.setFontSize(10);
          const lines = doc.splitTextToSize(e.descricao, MW);
          doc.text(lines, M, my);
          my += lines.length * 12;
        }
        my += 10;
      });
    my += 4;
  }

  if (d.formacao.length) {
    mainSection("Formação");
    d.formacao
      .filter((f) => f.curso || f.instituicao)
      .forEach((f) => {
        if (my > H - 60) {
          doc.addPage();
          my = 50;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...DARK);
        doc.text(f.curso || "", M, my);
        my += 13;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...RED);
        const meta = [f.instituicao, f.periodo].filter(Boolean).join(" • ");
        if (meta) {
          doc.text(meta, M, my);
          my += 14;
        }
        my += 4;
      });
  }

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Gerado por DESENROLA AI CLT", M, H - 20);

  // Silence unused warning
  void MUTED;

  return doc;
}