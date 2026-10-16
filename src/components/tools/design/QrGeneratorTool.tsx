import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  QrCode,
  Download,
  Copy,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  MessageCircle,
  User,
  Link,
  AlertTriangle,
  Sparkles,
  Check,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { CopyButton } from '../../ui/CopyButton';
import { useToast } from '../../ui/Toast';

type QrType = 'url' | 'wifi' | 'email' | 'phone' | 'sms' | 'whatsapp' | 'vcard';

export default function QrGeneratorTool() {
  const [qrType, setQrType] = useState<QrType>('url');

  // Input states
  const [urlInput, setUrlInput] = useState('https://ejemplo.com');
  const [wifiData, setWifiData] = useState({
    ssid: 'MiRedWiFi',
    password: '',
    auth: 'WPA' as 'WPA' | 'WEP' | 'nopass',
    hidden: false,
  });
  const [emailData, setEmailData] = useState({
    to: 'contacto@ejemplo.com',
    subject: 'Consulta',
    body: 'Hola, me gustaría más información.',
  });
  const [phoneInput, setPhoneInput] = useState('+34600000000');
  const [smsData, setSmsData] = useState({
    phone: '+34600000000',
    message: 'Hola, este es un mensaje rápido.',
  });
  const [waData, setWaData] = useState({
    phone: '34600000000',
    message: '¡Hola! Te contacto desde tu enlace QR.',
  });
  const [vCardData, setVCardData] = useState({
    firstName: 'Carlos',
    lastName: 'Gómez',
    org: 'Empresa Innovadora',
    phone: '+34 600 123 456',
    email: 'carlos@empresa.com',
    website: 'https://carlosgomez.dev',
    address: 'Madrid, España',
  });

  // QR Customization options
  const [size, setSize] = useState(280);
  const [margin, setMargin] = useState(2);
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [darkColor, setDarkColor] = useState('#0f172a');
  const [lightColor, setLightColor] = useState('#ffffff');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [svgString, setSvgString] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const { success, error: toastError } = useToast();

  // Compute raw payload based on type
  const rawPayload = useMemo(() => {
    switch (qrType) {
      case 'url':
        return urlInput.trim();

      case 'wifi': {
        const h = wifiData.hidden ? 'true' : 'false';
        return `WIFI:T:${wifiData.auth};S:${wifiData.ssid};P:${wifiData.password};H:${h};;`;
      }

      case 'email': {
        const query = [];
        if (emailData.subject) query.push(`subject=${encodeURIComponent(emailData.subject)}`);
        if (emailData.body) query.push(`body=${encodeURIComponent(emailData.body)}`);
        return `mailto:${emailData.to.trim()}${query.length ? '?' + query.join('&') : ''}`;
      }

      case 'phone':
        return `tel:${phoneInput.trim()}`;

      case 'sms':
        return `sms:${smsData.phone.trim()}?body=${encodeURIComponent(smsData.message)}`;

      case 'whatsapp': {
        const cleanPhone = waData.phone.replace(/[^0-9]/g, '');
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waData.message)}`;
      }

      case 'vcard':
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `N:${vCardData.lastName};${vCardData.firstName};;;`,
          `FN:${vCardData.firstName} ${vCardData.lastName}`,
          vCardData.org ? `ORG:${vCardData.org}` : '',
          vCardData.phone ? `TEL;TYPE=CELL:${vCardData.phone}` : '',
          vCardData.email ? `EMAIL:${vCardData.email}` : '',
          vCardData.website ? `URL:${vCardData.website}` : '',
          vCardData.address ? `ADR;TYPE=WORK:;;${vCardData.address};;;;` : '',
          'END:VCARD',
        ]
          .filter(Boolean)
          .join('\n');

      default:
        return urlInput;
    }
  }, [qrType, urlInput, wifiData, emailData, phoneInput, smsData, waData, vCardData]);

  // Contrast check
  const contrastRatio = useMemo(() => {
    const parse = (hex: string) => {
      const c = hex.replace('#', '');
      return {
        r: parseInt(c.slice(0, 2), 16) || 0,
        g: parseInt(c.slice(2, 4), 16) || 0,
        b: parseInt(c.slice(4, 6), 16) || 0,
      };
    };
    const rgb1 = parse(darkColor);
    const rgb2 = parse(lightColor);
    const lum = (rgb: { r: number; g: number; b: number }) => {
      const a = [rgb.r, rgb.g, rgb.b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };
    const l1 = lum(rgb1);
    const l2 = lum(rgb2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }, [darkColor, lightColor]);

  // Render QR via dynamic import of qrcode
  useEffect(() => {
    let isCancelled = false;

    const renderQr = async () => {
      if (!rawPayload.trim() || !canvasRef.current) return;
      setIsRendering(true);

      try {
        const QRCode = (await import('qrcode')).default;

        const options = {
          width: size,
          margin: margin,
          errorCorrectionLevel: errorLevel,
          color: {
            dark: darkColor,
            light: lightColor,
          },
        };

        if (canvasRef.current && !isCancelled) {
          await QRCode.toCanvas(canvasRef.current, rawPayload, options);
        }

        const svg = await QRCode.toString(rawPayload, {
          ...options,
          type: 'svg',
        });
        if (!isCancelled) {
          setSvgString(svg);
        }
      } catch (err) {
        console.error('Error renderizando código QR:', err);
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    };

    renderQr();
    return () => {
      isCancelled = true;
    };
  }, [rawPayload, size, margin, errorLevel, darkColor, lightColor]);

  // Download PNG
  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `codigo-qr-${qrType}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    success('Código QR descargado en PNG');
  };

  // Download SVG
  const handleDownloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codigo-qr-${qrType}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('Código QR descargado en SVG');
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          toastError('No se pudo generar la imagen para copiar');
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          success('Imagen QR copiada al portapapeles');
        } catch {
          toastError('Tu navegador no permite copiar imágenes binarias al portapapeles.');
        }
      }, 'image/png');
    } catch {
      toastError('Error al copiar imagen');
    }
  };

  const typesList: { id: QrType; label: string; icon: React.ReactNode }[] = [
    { id: 'url', label: 'Enlace / Texto', icon: <Link className="w-4 h-4" /> },
    { id: 'wifi', label: 'Red Wi-Fi', icon: <Wifi className="w-4 h-4" /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'vcard', label: 'Contacto vCard', icon: <User className="w-4 h-4" /> },
    { id: 'email', label: 'Correo', icon: <Mail className="w-4 h-4" /> },
    { id: 'phone', label: 'Teléfono', icon: <Phone className="w-4 h-4" /> },
    { id: 'sms', label: 'SMS', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-[var(--accent-text)]" />
          Generador de Códigos QR
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Crea códigos QR para enlaces, Wi-Fi, WhatsApp, vCard o correo con descarga en PNG y SVG.
        </p>
      </div>

      {/* QR Types Pills */}
      <div className="flex flex-wrap gap-2">
        {typesList.map((t) => (
          <button
            key={t.id}
            onClick={() => setQrType(t.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              qrType === t.id
                ? 'bg-[var(--accent-color)] text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Contenido del código QR
            </h3>

            {/* Type: URL */}
            {qrType === 'url' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  URL o texto general
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
                />
              </div>
            )}

            {/* Type: WIFI */}
            {qrType === 'wifi' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nombre de la red (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiData.ssid}
                    onChange={(e) => setWifiData({ ...wifiData, ssid: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contraseña
                  </label>
                  <input
                    type="text"
                    value={wifiData.password}
                    onChange={(e) => setWifiData({ ...wifiData, password: e.target.value })}
                    placeholder="Contraseña del router"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Seguridad
                    </label>
                    <select
                      value={wifiData.auth}
                      onChange={(e) => setWifiData({ ...wifiData, auth: e.target.value as any })}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs mt-1"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">Sin contraseña</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wifiData.hidden}
                        onChange={(e) => setWifiData({ ...wifiData, hidden: e.target.checked })}
                        className="rounded accent-[var(--accent-color)]"
                      />
                      <span>Red oculta</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Type: WhatsApp */}
            {qrType === 'whatsapp' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Número con prefijo de país (sin + ni espacios)
                  </label>
                  <input
                    type="text"
                    value={waData.phone}
                    onChange={(e) => setWaData({ ...waData, phone: e.target.value })}
                    placeholder="34600123456"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mensaje predeterminado
                  </label>
                  <textarea
                    rows={3}
                    value={waData.message}
                    onChange={(e) => setWaData({ ...waData, message: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm mt-1 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Type: vCard */}
            {qrType === 'vcard' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Nombre</label>
                  <input
                    type="text"
                    value={vCardData.firstName}
                    onChange={(e) => setVCardData({ ...vCardData, firstName: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Apellido</label>
                  <input
                    type="text"
                    value={vCardData.lastName}
                    onChange={(e) => setVCardData({ ...vCardData, lastName: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Empresa / Cargo</label>
                  <input
                    type="text"
                    value={vCardData.org}
                    onChange={(e) => setVCardData({ ...vCardData, org: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Teléfono</label>
                  <input
                    type="text"
                    value={vCardData.phone}
                    onChange={(e) => setVCardData({ ...vCardData, phone: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Correo</label>
                  <input
                    type="email"
                    value={vCardData.email}
                    onChange={(e) => setVCardData({ ...vCardData, email: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Sitio Web</label>
                  <input
                    type="url"
                    value={vCardData.website}
                    onChange={(e) => setVCardData({ ...vCardData, website: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-1"
                  />
                </div>
              </div>
            )}

            {/* Type: Email */}
            {qrType === 'email' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Destinatario</label>
                  <input
                    type="email"
                    value={emailData.to}
                    onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Asunto</label>
                  <input
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mensaje</label>
                  <textarea
                    rows={2}
                    value={emailData.body}
                    onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm mt-1 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Type: Phone */}
            {qrType === 'phone' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Número de teléfono</label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm mt-1"
                />
              </div>
            )}

            {/* Type: SMS */}
            {qrType === 'sms' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Número de teléfono</label>
                  <input
                    type="tel"
                    value={smsData.phone}
                    onChange={(e) => setSmsData({ ...smsData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Texto del SMS</label>
                  <textarea
                    rows={2}
                    value={smsData.message}
                    onChange={(e) => setSmsData({ ...smsData, message: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm mt-1 resize-none"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Customization Options */}
          <Card className="p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Personalización y Colores
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* Size */}
              <div>
                <label className="text-slate-500 font-bold block mb-1">Tamaño: {size}px</label>
                <input
                  type="range"
                  min="160"
                  max="480"
                  step="20"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full accent-[var(--accent-color)]"
                />
              </div>

              {/* Margin */}
              <div>
                <label className="text-slate-500 font-bold block mb-1">Margen: {margin}</label>
                <input
                  type="range"
                  min="0"
                  max="6"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full accent-[var(--accent-color)]"
                />
              </div>

              {/* Error correction */}
              <div>
                <label className="text-slate-500 font-bold block mb-1">Corrección de error</label>
                <select
                  value={errorLevel}
                  onChange={(e) => setErrorLevel(e.target.value as any)}
                  className="w-full p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="L">L (7%)</option>
                  <option value="M">M (15%)</option>
                  <option value="Q">Q (25%)</option>
                  <option value="H">H (30%)</option>
                </select>
              </div>

              {/* Color pickers */}
              <div>
                <label className="text-slate-500 font-bold block mb-1">Colores (QR / Fondo)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={darkColor}
                    onChange={(e) => setDarkColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    title="Color de los módulos"
                  />
                  <input
                    type="color"
                    value={lightColor}
                    onChange={(e) => setLightColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0"
                    title="Color de fondo"
                  />
                </div>
              </div>
            </div>

            {/* Contrast warning */}
            {contrastRatio < 3.0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Aviso: El contraste entre el color del QR y el fondo es bajo ({contrastRatio.toFixed(1)}:1). Algunos lectores de cámara podrían tener dificultades para escanearlo.
                </span>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Live Preview & Downloads */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <Card className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Vista Previa en Vivo
            </span>

            <div className="p-4 rounded-3xl bg-white shadow-md border border-slate-200/80 max-w-full overflow-hidden flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto rounded-xl"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            <p className="text-xs text-slate-400 font-mono break-all max-w-xs truncate">
              {rawPayload}
            </p>

            {/* Action Buttons */}
            <div className="w-full flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                icon={<Download className="w-4 h-4" />}
                onClick={handleDownloadPng}
              >
                Descargar PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                icon={<Download className="w-4 h-4" />}
                onClick={handleDownloadSvg}
              >
                Descargar SVG
              </Button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              icon={<Copy className="w-4 h-4" />}
              onClick={handleCopyImage}
            >
              Copiar imagen al portapapeles
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
