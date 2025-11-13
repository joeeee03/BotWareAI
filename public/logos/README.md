📌 CARPETA DE LOGOS - INSTRUCCIONES

Para que el logo aparezca en tu web, sigue estos pasos:

1️⃣ DESCARGA TU LOGO
   - Asegúrate de que sea una imagen PNG, JPG o SVG
   - Preferiblemente con fondo transparente (PNG recomendado)
   - Tamaño recomendado: 200x200px a 500x500px

2️⃣ SUBE LA IMAGEN
   - Sube tu logo a ESTA carpeta (public/logos/)
   - IMPORTANTE: Nómbralo así → company-logo.png
   - O si prefieres otro formato → company-logo.jpg o company-logo.svg

3️⃣ ¡LISTO!
   - La web automáticamente cargará tu logo
   - Aparecerá en la parte superior de la aplicación
   - El componente está configurado para buscar "company-logo.png"

📁 ESTRUCTURA:
   public/
   └── logos/
       └── company-logo.png  ← Aquí va tu logo
       
🎨 CARACTERÍSTICAS:
   ✅ Se redimensiona automáticamente
   ✅ Responsive (se adapta a celular y desktop)
   ✅ Con sombra elegante
   ✅ Borde redondeado opcional

⚠️ IMPORTANTE:
   - Si cambias el nombre, el logo NO aparecerá
   - Asegúrate de escribir exactamente: company-logo.png
   - Si usas JPG: company-logo.jpg
   - Si usas SVG: company-logo.svg

📝 SI QUIERES CAMBIAR EL NOMBRE:
   En el archivo components/Logo.tsx busca la línea:
   src="/logos/company-logo.png"
   
   Y cámbialo por tu nombre. Pero SI USAS:
   company-logo.png ← No cambies nada!

❓ ¿Dudas?
   Lee INSTRUCCIONES_FINALES.md para más info
