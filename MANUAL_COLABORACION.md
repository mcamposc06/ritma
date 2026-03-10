# Manual de Colaboración - Equipo Ritma

Este documento describe el flujo de trabajo de Git/GitHub para que los 5 integrantes del equipo puedan colaborar de manera ordenada y sin sobrescribir el código de los demás.

## 1. Clonar el repositorio
El primer paso para cada integrante es clonar el proyecto en su computadora local. Solo se hace la primera vez:
```bash
git clone https://github.com/mcamposc06/ritma.git
cd ritma
```
*(Nota: Pídele a Marvin o al administrador del repo que te invite como colaborador en GitHub si es un repositorio privado).*

## 2. Instalación de dependencias
Una vez clonado, debes instalar los paquetes y dependencias del proyecto (expo, react native, etc):
```bash
npm install
```

## 3. Variables de Entorno (`.env`)
En este proyecto, hemos decidido incluir el `.env` en el repositorio (esto no es común en producción, pero es útil para ciertas fases de desarrollo o pruebas en equipo). Al hacer el clone y el pull, ya tendrás las variables de entorno listas, no es necesario hacerles nada más a menos que agregues una nueva clave.

## 4. Flujo de Trabajo Diario (Directo en Main)

Para este proyecto agilizaremos el desarrollo trabajando **directamente en la rama `main`**. Para evitar conflictos, seguiremos estos pasos:

### 4.1. Sincronizar el código (Importante)
Antes de empezar a trabajar cada día (o antes de iniciar una nueva función), asegúrate de tener la última versión del código de tus compañeros:
```bash
git pull origin main
```

### 4.2. Apoyarse en Antigravity AI (OBLIGATORIO)
Como parte principal de nuestro flujo de desarrollo, utilizaremos al asistente de inteligencia artificial **Antigravity**.
- Pídele a Antigravity que te ayude a **completar la app**.
- Solicita su ayuda para **mejorar funciones** o componentes existentes.
- Pídele que **encuentre y resuelva bugs** (errores) por ti.
- Úsalo para **agregar nuevas funciones** desde cero.

El objetivo es que Antigravity programe la mayor parte del código. Tú guiarás a la IA indicándole qué necesitas hacer.

### 4.3. Guardar cambios (Commit con Source Control)
En lugar de usar comandos de terminal, usaremos la interfaz visual de nuestro editor (VS Code o Cursor):

1. Ve a la pestaña **Source Control** (Control de Código Fuente) en la barra lateral izquierda (el ícono de las tres ramitas, atajo: `Ctrl+Shift+G` o `Cmd+Shift+G`).
2. Verás la lista de archivos modificados. Haz clic en el ícono del **`+`** (Stage All Changes) al lado de "Changes" para preparar todos los archivos.
3. **Generar mensaje con Antigravity:** En lugar de escribir el mensaje a mano, haz clic en el botón con el ícono de las estrellitas (✨) al lado de la caja del mensaje de commit para **generar un mensaje automáticamente** usando la IA de nuestro editor.
4. Haz clic en el botón de **Commit**.

### 4.4. Subir tus cambios (Sync Changes)
Una vez hecho el commit, el botón de la pestaña Source Control cambiará a **"Sync Changes"** (Sincronizar Cambios). 
1. Haz clic en **Sync Changes**. 
2. Esto automáticamente subirá (push) tus cambios a GitHub y descargará (pull) cualquier cambio nuevo que hayan hecho tus compañeros.

*(Nota: Si al hacer Sync Changes tu editor te avisa que hay conflictos, avísale al equipo o pídele a Antigravity que te ayude a resolver "Merge Conflicts").*

---

### En resumen, tu día a día será:
1. Ir a la pestaña **Source Control** y presionar el botón de **Sync Changes** (o hacer `git pull origin main` en la terminal) para tener lo más reciente.
2. Pedirle a **Antigravity** que desarrolle, repare o mejore código.
3. Comprobar que los cambios de Antigravity funcionen correctamente.
4. En **Source Control**: Darle al `+` para agregar archivos, generar el mensaje con las estrellitas ✨ y presionar **Commit**.
5. Presionar **Sync Changes** para subir todo a GitHub.
