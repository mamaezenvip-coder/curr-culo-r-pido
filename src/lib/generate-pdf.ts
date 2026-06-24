import { jsPDF } from "jspdf";
import type { ResumeData } from "./resume-types";
import type { TemplateId } from "./resume-templates";

// Professional PDF generator with multiple template layouts.
export function generateResumePdf(d: ResumeData, template: TemplateId = "executivo"): jsPDF {
  if (template === "minimalista") return generateMinimalista(d);
  if (template === "moderno") return generateModerno(d);
  return generateExecutivo(d);
}

function generateExecutivo(d: ResumeData): jsPDF {
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

/* =================== MINIMALISTA =================== */
function generateMinimalista(d: ResumeData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const RED: [number, number, number] = [180, 25, 30];
  const DARK: [number, number, number] = [25, 25, 28];
  const M = 56;
  const MW = W - M * 2;
  let y = 70;

  // Header
  if (d.fotoDataUrl) {
    try {
      doc.addImage(d.fotoDataUrl, "JPEG", W - M - 80, y - 10, 80, 80);
    } catch {
      // ignore
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(...DARK);
  doc.text(d.nome || "Seu Nome", M, y);
  y += 22;
  if (d.profissao) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.setTextColor(...RED);
    doc.text(d.profissao, M, y);
    y += 18;
  }
  // Contact line
  const contact = [d.telefone, d.email, d.cidade].filter(Boolean).join("  •  ");
  if (contact) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(110, 110, 110);
    doc.text(contact, M, y);
    y += 14;
  }
  // Red rule
  doc.setDrawColor(...RED);
  doc.setLineWidth(1.5);
  doc.line(M, y + 4, M + 50, y + 4);
  y += 26;

  const section = (title: string) => {
    if (y > H - 80) {
      doc.addPage();
      y = 70;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...RED);
    doc.text(title.toUpperCase(), M, y);
    y += 5;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.6);
    doc.line(M, y, M + MW, y);
    y += 14;
  };

  if (d.resumo) {
    section("Perfil");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(d.resumo, MW);
    doc.text(lines, M, y);
    y += lines.length * 13 + 14;
  }

  if (d.experiencias.filter((e) => e.cargo || e.empresa).length) {
    section("Experiência");
    d.experiencias
      .filter((e) => e.cargo || e.empresa)
      .forEach((e) => {
        if (y > H - 80) {
          doc.addPage();
          y = 70;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...DARK);
        doc.text(e.cargo || "", M, y);
        if (e.periodo) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(140, 140, 140);
          doc.text(e.periodo, M + MW, y, { align: "right" });
        }
        y += 14;
        if (e.empresa) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(...RED);
          doc.text(e.empresa, M, y);
          y += 13;
        }
        if (e.descricao) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(70, 70, 70);
          const lines = doc.splitTextToSize(e.descricao, MW);
          doc.text(lines, M, y);
          y += lines.length * 12;
        }
        y += 10;
      });
  }

  if (d.formacao.filter((f) => f.curso || f.instituicao).length) {
    section("Formação");
    d.formacao
      .filter((f) => f.curso || f.instituicao)
      .forEach((f) => {
        if (y > H - 60) {
          doc.addPage();
          y = 70;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...DARK);
        doc.text(f.curso || "", M, y);
        if (f.periodo) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(140, 140, 140);
          doc.text(f.periodo, M + MW, y, { align: "right" });
        }
        y += 13;
        if (f.instituicao) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(...RED);
          doc.text(f.instituicao, M, y);
          y += 16;
        }
      });
    y += 6;
  }

  const skills = d.habilidades.filter((h) => h.trim());
  if (skills.length) {
    section("Habilidades");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const text = skills.join("  •  ");
    const lines = doc.splitTextToSize(text, MW);
    doc.text(lines, M, y);
    y += lines.length * 13 + 10;
  }

  const langs = d.idiomas.filter((i) => i.trim());
  if (langs.length) {
    section("Idiomas");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(langs.join("  •  "), M, y);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("Gerado por DESENROLA AI CLT", M, H - 20);
  return doc;
}

/* =================== MODERNO =================== */
function generateModerno(d: ResumeData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const RED: [number, number, number] = [180, 25, 30];
  const DARK: [number, number, number] = [25, 25, 28];

  // Header band
  const HEADER_H = 130;
  doc.setFillColor(...RED);
  doc.rect(0, 0, W, HEADER_H, "F");
  doc.setFillColor(25, 25, 28);
  doc.rect(0, HEADER_H, W, 6, "F");

  const photoSize = 90;
  let headerTextX = 40;
  if (d.fotoDataUrl) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.circle(40 + photoSize / 2, 20 + photoSize / 2, photoSize / 2 + 3, "F");
      doc.addImage(d.fotoDataUrl, "JPEG", 40, 20, photoSize, photoSize);
      headerTextX = 40 + photoSize + 20;
    } catch {
      // ignore
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text(d.nome || "Seu Nome", headerTextX, 50);
  if (d.profissao) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(d.profissao.toUpperCase(), headerTextX, 70);
  }
  doc.setFontSize(9.5);
  const contact = [d.telefone, d.email, d.cidade].filter(Boolean).join("   |   ");
  if (contact) doc.text(contact, headerTextX, 95);

  // Body two columns
  const LEFT_X = 40;
  const LEFT_W = 200;
  const RIGHT_X = LEFT_X + LEFT_W + 30;
  const RIGHT_W = W - RIGHT_X - 40;
  let ly = HEADER_H + 30;
  let ry = HEADER_H + 30;

  const leftSection = (title: string) => {
    if (ly > H - 60) {
      doc.addPage();
      ly = 50;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...RED);
    doc.text(title.toUpperCase(), LEFT_X, ly);
    ly += 5;
    doc.setDrawColor(...RED);
    doc.setLineWidth(1);
    doc.line(LEFT_X, ly, LEFT_X + 30, ly);
    ly += 14;
  };
  const rightSection = (title: string) => {
    if (ry > H - 60) {
      doc.addPage();
      ry = 50;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...RED);
    doc.text(title.toUpperCase(), RIGHT_X, ry);
    ry += 5;
    doc.setDrawColor(...RED);
    doc.setLineWidth(1.5);
    doc.line(RIGHT_X, ry, RIGHT_X + 40, ry);
    ry += 16;
  };

  // LEFT: skills + langs
  const skills = d.habilidades.filter((h) => h.trim());
  if (skills.length) {
    leftSection("Habilidades");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    skills.forEach((s) => {
      doc.setFillColor(...RED);
      doc.circle(LEFT_X + 3, ly - 3, 1.6, "F");
      const lines = doc.splitTextToSize(s, LEFT_W - 14);
      doc.text(lines, LEFT_X + 10, ly);
      ly += lines.length * 12 + 3;
    });
    ly += 12;
  }
  const langs = d.idiomas.filter((i) => i.trim());
  if (langs.length) {
    leftSection("Idiomas");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    langs.forEach((l) => {
      doc.setFillColor(...RED);
      doc.circle(LEFT_X + 3, ly - 3, 1.6, "F");
      doc.text(l, LEFT_X + 10, ly);
      ly += 14;
    });
  }

  // RIGHT: perfil, experiencias, formacao
  if (d.resumo) {
    rightSection("Perfil");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(d.resumo, RIGHT_W);
    doc.text(lines, RIGHT_X, ry);
    ry += lines.length * 13 + 14;
  }

  if (d.experiencias.filter((e) => e.cargo || e.empresa).length) {
    rightSection("Experiência");
    d.experiencias
      .filter((e) => e.cargo || e.empresa)
      .forEach((e) => {
        if (ry > H - 80) {
          doc.addPage();
          ry = 50;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...DARK);
        doc.text(e.cargo || "", RIGHT_X, ry);
        ry += 13;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...RED);
        const meta = [e.empresa, e.periodo].filter(Boolean).join(" • ");
        if (meta) {
          doc.text(meta, RIGHT_X, ry);
          ry += 13;
        }
        if (e.descricao) {
          doc.setTextColor(70, 70, 70);
          doc.setFontSize(10);
          const lines = doc.splitTextToSize(e.descricao, RIGHT_W);
          doc.text(lines, RIGHT_X, ry);
          ry += lines.length * 12;
        }
        ry += 8;
      });
  }

  if (d.formacao.filter((f) => f.curso || f.instituicao).length) {
    rightSection("Formação");
    d.formacao
      .filter((f) => f.curso || f.instituicao)
      .forEach((f) => {
        if (ry > H - 60) {
          doc.addPage();
          ry = 50;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...DARK);
        doc.text(f.curso || "", RIGHT_X, ry);
        ry += 13;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...RED);
        const meta = [f.instituicao, f.periodo].filter(Boolean).join(" • ");
        if (meta) {
          doc.text(meta, RIGHT_X, ry);
          ry += 16;
        }
      });
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("Gerado por DESENROLA AI CLT", 40, H - 20);
  return doc;
}