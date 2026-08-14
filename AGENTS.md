# Instrucciones de trabajo para ER Abogados

## Principio rector

Cuando una versión ya funciona bien, está aprobada o tiene una dirección visual definida, se trata
como línea base. Los cambios posteriores deben ser puntuales, conservadores y limitados exactamente
a lo solicitado. No se debe reinterpretar el proyecto ni “mejorarlo” fuera del alcance pedido.

## Control de cambios

1. Antes de editar, comparar el estado actual con la última versión funcional o aprobada.
2. Hacer el cambio mínimo capaz de resolver la solicitud.
3. Si se solicita reemplazar un texto, imagen, video, dato o archivo, reemplazar únicamente ese
   elemento. No agregar capas, filtros, animaciones, scripts, dependencias, rediseños o cambios de
   comportamiento salvo que se soliciten expresamente.
4. No modificar tipografía, colores, espaciado, estructura, navegación, jerarquía, responsive,
   rendimiento, contenido o arquitectura que ya estén funcionando si no forman parte del pedido.
5. No extender el alcance basándose en preferencias propias. Si una mejora adicional parece
   necesaria, explicarla primero y esperar autorización.
6. Ante una ambigüedad que pueda cambiar el resultado aprobado, detenerse y preguntar en lugar de
   inventar una solución.
7. Mantener separados landing, aplicación y API. Un ajuste en un proyecto no autoriza cambios en
   los otros.

## Verificación obligatoria

- Revisar el diff antes de terminar y confirmar que no existan cambios ajenos al pedido.
- Probar el resultado en escritorio y móvil cuando tenga impacto visual o responsive.
- Ejecutar compilación y pruebas proporcionales al cambio.
- Comparar el resultado final con la línea base, no solamente comprobar que “funciona”.
- Informar con precisión qué se cambió y qué se preservó.

## Regla especial para elementos audiovisuales

Al cambiar un video o una imagen de portada se debe conservar el reproductor, layout, overlays,
color, carga y comportamiento aprobados. El archivo audiovisual debe prepararse para encajar en la
experiencia existente; la experiencia no debe rediseñarse para acomodar el archivo, salvo
instrucción explícita del usuario.

