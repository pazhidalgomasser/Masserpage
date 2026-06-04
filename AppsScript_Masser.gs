/* =========================================================
   MASSER — Backend del formulario de contacto
   Google Apps Script (envía un correo cuando un cliente
   completa el formulario del sitio masser.cl)
   =========================================================

   QUÉ HACE:
   - Recibe los datos del formulario (nombre, email, teléfono,
     tipo de proyecto y mensaje).
   - Te envía un correo a EMAIL_DESTINO con esos datos.
   - Deja el correo del cliente como "responder a", así puedes
     contestarle directamente desde Gmail.
   - Devuelve {"ok": true} para que el sitio muestre el mensaje
     de éxito.

   CÓMO PUBLICARLO: ver el archivo GUIA-INSTALACION.md (paso 2).
   ========================================================= */

// >>> Correo donde quieres recibir los mensajes del sitio:
const EMAIL_DESTINO = "info@masser.cl";

// (Opcional) copia oculta a otra dirección. Deja "" si no la usas.
const EMAIL_COPIA_OCULTA = "";

function doPost(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};

    // Anti-spam: si el campo trampa viene lleno, ignoramos en silencio.
    if (p._gotcha) {
      return json({ ok: true });
    }

    var nombre   = (p.nombre   || "").toString().trim();
    var email    = (p.email    || "").toString().trim();
    var telefono = (p.telefono || "").toString().trim();
    var tipo     = (p.tipo     || "").toString().trim();
    var mensaje  = (p.mensaje  || "").toString().trim();

    if (!nombre || !email || !mensaje) {
      return json({ ok: false, error: "Faltan campos obligatorios." });
    }

    var tipoTexto = {
      casas: "Casas / Viviendas",
      oficinas: "Oficinas / Corporativo",
      colegios: "Colegios y Jardines / Educación"
    }[tipo] || (tipo || "No especificado");

    var asunto = "Nueva solicitud de contacto — " + nombre +
                 (tipoTexto ? " (" + tipoTexto + ")" : "");

    var cuerpo =
      "Has recibido una nueva solicitud desde masser.cl\n\n" +
      "Nombre:            " + nombre + "\n" +
      "Correo:            " + email + "\n" +
      "Teléfono:          " + (telefono || "—") + "\n" +
      "Tipo de proyecto:  " + tipoTexto + "\n" +
      "------------------------------------------------------------\n" +
      "Mensaje:\n" + mensaje + "\n" +
      "------------------------------------------------------------\n\n" +
      "Fecha: " + new Date().toLocaleString("es-CL") + "\n";

    var opciones = { name: "Sitio web Masser" };
    // Permite responder directamente al cliente:
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      opciones.replyTo = email;
    }
    if (EMAIL_COPIA_OCULTA) {
      opciones.bcc = EMAIL_COPIA_OCULTA;
    }

    MailApp.sendEmail(EMAIL_DESTINO, asunto, cuerpo, opciones);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Permite abrir la URL en el navegador para comprobar que está viva.
function doGet() {
  return json({ ok: true, status: "Masser form endpoint activo" });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
