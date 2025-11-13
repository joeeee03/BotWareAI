# 🎨 GUÍA DE SETUP DE LOGO - Paso a Paso

## 📁 ¿Dónde va tu logo?

Tu logo debe ir en esta carpeta:
```
project/
├── public/
│   └── logos/
│       └── company-logo.png  ← AQUÍ VA TU LOGO
```

## 📥 PASOS PARA AGREGAR TU LOGO

### Paso 1: Prepara tu imagen
- Descarga tu logo de la empresa
- Asegúrate de que sea PNG, JPG o SVG
- **Recomendado**: PNG con fondo transparente
- **Tamaño ideal**: 200x200px a 500x500px

### Paso 2: Sube a la carpeta
- Ve a la carpeta: `public/logos/`
- Sube tu imagen ahí
- **IMPORTANTE**: Nómbralo exactamente así: `company-logo.png`

### Paso 3: ¡Listo!
Abre tu web en http://localhost:3000/login
Tu logo debería aparecer automáticamente en la parte superior

---

## ⚙️ NOMBRES PERMITIDOS

El componente buscará automáticamente en este orden:
1. `company-logo.png` ← RECOMENDADO (esto es lo que usamos)
2. `company-logo.jpg`
3. `company-logo.svg`

**Elige UN SOLO nombre y usa exactamente ese.**

---

## 🎯 DÓNDE APARECE EL LOGO

El logo aparece en:
- ✅ Página de Login (`/login`)
- ✅ Página de Chats (`/chats`) - si lo añades al layout
- ✅ Cualquier página donde agregues el componente

---

## 📝 SI QUIERES CAMBIAR DÓNDE VA

En el archivo `components/CompanyLogo.tsx` busca esta línea:

```typescript
const logoPath = '/logos/company-logo.png'
```

Y cambialo por:
```typescript
const logoPath = '/logos/your-custom-name.png'
```

Pero si usas `company-logo.png`, no cambies nada.

---

## 🎨 CARACTERÍSTICAS DEL LOGO

El logo se mostrará con:
- ✨ Sombra elegante (drop-shadow)
- 📱 Responsive (se adapta a celular y desktop)
- 🎯 Tamaño automático (112x112px en web)
- 🎭 Si no encuentra la imagen, muestra un icono por defecto

---

## 🖼️ ARCHIVOS DE EJEMPLO

En esta carpeta encontrarás:
- `company-logo-example.svg` ← Ejemplo de cómo se vería

Puedes usar este SVG como referencia o copiarlo y modificarlo.

---

## ❌ SI NO VE EL LOGO

**Verifica:**
1. ¿El archivo está en `public/logos/`?
2. ¿El nombre es exactamente `company-logo.png`?
3. ¿Reiniciaste el servidor (`npm run dev`)?
4. ¿El navegador tiene caché? (Intenta Ctrl+Shift+R)

Si aún así no aparece, verás un icono azul por defecto.

---

## 📋 CHECKLIST RÁPIDA

- [ ] Preparé mi logo en PNG/JPG/SVG
- [ ] Subí la imagen a `public/logos/`
- [ ] La nombré `company-logo.png`
- [ ] Reinicié el servidor
- [ ] Abrí http://localhost:3000/login
- [ ] ¡Veo mi logo!

---

## 🚀 PARA PRODUCCIÓN (Railway)

Cuando deployes en Railway:
1. Sube tu logo aquí primero
2. Haz git push
3. Railway automáticamente incluirá tu logo en la imagen Docker
4. ¡Tu logo estará en producción!

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Qué tamaño debe tener?**
A: 200x200px mínimo, 500x500px máximo. Lo importante es que sea cuadrado.

**P: ¿Qué formato es mejor?**
A: PNG con transparencia es lo mejor. Así se ve bien en cualquier fondo.

**P: ¿Puedo usar GIF?**
A: No, usa PNG, JPG o SVG.

**P: ¿Puedo cambiar el nombre?**
A: Sí, pero luego cambia también en `CompanyLogo.tsx`

**P: ¿Aparece en mobile también?**
A: Sí, el componente es responsive.

---

**Última actualización**: 2024-11-12
**Status**: ✅ Listo para usar
