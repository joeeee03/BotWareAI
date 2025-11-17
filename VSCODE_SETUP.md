# VS Code Setup - Eliminar Advertencias de CSS

Las advertencias de CSS que ves son **falsos positivos**. Las directivas `@custom-variant`, `@theme`, y `@apply` son **válidas de Tailwind CSS v4** y funcionan perfectamente.

## Solución Rápida

Crea el archivo `.vscode/settings.json` con este contenido:

```json
{
  "css.validate": false,
  "css.lint.unknownAtRules": "ignore",
  "scss.validate": false,
  "less.validate": false
}
```

## Pasos:

1. Crea la carpeta `.vscode` en la raíz del proyecto (si no existe)
2. Crea el archivo `settings.json` dentro de `.vscode/`
3. Copia y pega el contenido JSON de arriba
4. Guarda el archivo
5. Recarga la ventana de VS Code: `Ctrl+Shift+P` → "Reload Window"

✅ Las advertencias desaparecerán y tu IDE estará limpio.

## Alternativa: Configuración Global

Si prefieres aplicar esto a todos tus proyectos:

1. Abre configuración de VS Code: `Ctrl+,`
2. Busca "css validate"
3. Desmarca todas las opciones de validación CSS
4. Busca "css lint unknown"
5. Cambia a "ignore"

---

**Nota**: Estas advertencias NO afectan la funcionalidad. La aplicación funciona perfectamente en Railway.
