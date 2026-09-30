# Backlog — Mini Jira (MVP)

**Fuente:** docs/specs.md (PRD)
**Formato:** Historias de usuario + escenarios Gherkin declarativos (foco en el QUÉ, no en IDs de UI). Cada historia referencia el/los RF que la originan. Los edge cases y escenarios de fallo son deducidos por el Product Owner a partir de las reglas de negocio de specs.md.

---

## Historia 1: Registro y autenticación

Como persona de la empresa quiero registrarme e iniciar sesión con usuario y contraseña propios para acceder a mis proyectos y tickets de forma segura.

**RF de origen:** RF-01

```gherkin
Escenario: Registro exitoso con email obligatorio
  Dado que soy una persona sin cuenta en el sistema
  Cuando me registro proporcionando usuario, contraseña y email
  Entonces se crea mi cuenta asociada a ese email

Escenario: Login exitoso
  Dado que tengo una cuenta registrada
  Cuando inicio sesión con mi usuario y contraseña correctos
  Entonces accedo al sistema con mi rol asignado
```

**Edge cases / fallos (deducidos):**

```gherkin
Escenario: Registro sin email
  Dado que intento registrarme sin proporcionar un email
  Cuando envío el formulario de registro
  Entonces el sistema rechaza el registro por falta de email obligatorio

Escenario: Login con credenciales incorrectas
  Dado que tengo una cuenta registrada
  Cuando inicio sesión con una contraseña incorrecta
  Entonces el sistema rechaza el acceso

Escenario: Registro con nombre de usuario ya existente
  Dado que ya existe una cuenta con un usuario determinado
  Cuando otra persona intenta registrarse con ese mismo usuario
  Entonces el sistema rechaza el registro por duplicidad
```

---

## Historia 2: Permisos ampliados del Admin sobre tickets

Como Admin quiero poder editar y archivar tickets de cualquier usuario para poder gestionar el trabajo de todo el equipo.

**RF de origen:** RF-02, RF-03

```gherkin
Escenario: Admin edita un ticket creado por otro usuario
  Dado que existe un ticket creado por un Usuario normal
  Cuando un Admin edita ese ticket
  Entonces los cambios se guardan correctamente

Escenario: Admin archiva un ticket de cualquier usuario
  Dado que existe un ticket creado por un Usuario normal
  Cuando un Admin archiva (soft-delete) ese ticket
  Entonces el ticket queda archivado y la acción queda trazada como realizada por el Admin
```

**Edge case (deducido):**

```gherkin
Escenario: Usuario normal intenta editar un ticket ajeno
  Dado que soy Usuario normal y no creé ni tengo asignado un ticket
  Cuando intento editar ese ticket
  Entonces el sistema rechaza la acción
```

---

## Historia 3: Gestión de tickets propios o asignados

Como Usuario normal quiero crear, editar y cambiar el estado de los tickets que creé o en los que estoy asignado, para gestionar mi propio trabajo.

**RF de origen:** RF-04

```gherkin
Escenario: Usuario normal edita un ticket que creó
  Dado que soy Usuario normal y creé un ticket
  Cuando edito ese ticket
  Entonces los cambios se guardan

Escenario: Usuario normal edita un ticket en el que fue asignado
  Dado que soy Usuario normal y estoy asignado a un ticket creado por otra persona
  Cuando edito ese ticket
  Entonces los cambios se guardan
```

---

## Historia 4: Archivado (soft-delete) de tickets con trazabilidad

Como Usuario normal quiero poder archivar los tickets que creé o en los que estoy asignado, para retirarlos de mi vista de trabajo activo sin perder el historial.

**RF de origen:** RF-05, RF-06

```gherkin
Escenario: Usuario normal archiva un ticket propio
  Dado que soy Usuario normal y creé un ticket
  Cuando elijo "Eliminar" sobre ese ticket
  Entonces el ticket queda archivado (soft-delete) y no se borra físicamente
```

**Edge case (deducido):**

```gherkin
Escenario: Usuario normal intenta archivar un ticket ajeno
  Dado que soy Usuario normal y no creé ni estoy asignado a un ticket
  Cuando intento archivarlo
  Entonces el sistema rechaza la acción
```

---

## Historia 5: Gestión de proyectos y visibilidad por rol

Como persona de la empresa quiero crear proyectos y ver solo los proyectos relevantes para mi rol, para mantener organizado el trabajo del equipo sin exponer proyectos ajenos.

**RF de origen:** RF-07, RF-08, RF-09, RF-09-bis

```gherkin
Escenario: Usuario normal crea un proyecto
  Dado que soy Usuario normal
  Cuando creo un nuevo proyecto
  Entonces el proyecto queda registrado y soy su creador

Escenario: Admin ve todos los proyectos
  Dado que soy Admin
  Cuando accedo al listado de proyectos
  Entonces veo todos los proyectos existentes en el sistema

Escenario: Usuario normal ve solo sus proyectos
  Dado que soy Usuario normal
  Cuando accedo al listado de proyectos
  Entonces solo veo los proyectos que creé o a los que fui asignado como miembro

Escenario: El creador del proyecto asigna miembros
  Dado que soy el creador de un proyecto
  Cuando asigno a un Usuario normal como miembro del proyecto
  Entonces ese usuario pasa a tener visibilidad sobre el proyecto

Escenario: Admin asigna miembros a cualquier proyecto
  Dado que soy Admin
  Cuando asigno un usuario a un proyecto que no creé
  Entonces la asignación se realiza correctamente
```

**Edge cases (deducidos):**

```gherkin
Escenario: Usuario normal intenta asignar miembros a un proyecto que no creó
  Dado que soy Usuario normal y no soy el creador de un proyecto
  Cuando intento asignar un miembro a ese proyecto
  Entonces el sistema rechaza la acción

Escenario: Creación de ticket sin proyecto asociado
  Dado que estoy creando un nuevo ticket
  Cuando intento guardarlo sin seleccionar un proyecto
  Entonces el sistema rechaza la creación por falta del proyecto obligatorio
```

---

## Historia 6: Creación de tickets con campos completos

Como persona de la empresa quiero crear tickets con título, descripción, prioridad, fecha, responsable(s), proyecto y etiquetas, para documentar el trabajo con el detalle necesario.

**RF de origen:** RF-07, RF-11

```gherkin
Escenario: Creación de ticket con todos los campos
  Dado que estoy creando un ticket
  Cuando completo título, descripción, prioridad, fecha, responsable(s), proyecto y etiquetas
  Entonces el ticket se crea asociado a exactamente un proyecto

Escenario: Ticket con múltiples etiquetas de texto libre
  Dado que estoy creando o editando un ticket
  Cuando añado varias etiquetas como texto libre
  Entonces todas las etiquetas quedan asociadas al ticket
```

**Edge case (deducido):**

```gherkin
Escenario: Prioridad fuera de los valores permitidos
  Dado que estoy creando un ticket
  Cuando intento asignar una prioridad distinta de Alta, Media o Baja
  Entonces el sistema rechaza el valor
```

---

## Historia 7: Asignación múltiple de responsables

Como persona de la empresa quiero asignar varias personas a un mismo ticket, para reflejar el trabajo colaborativo.

**RF de origen:** RF-10

```gherkin
Escenario: Asignar múltiples personas a un ticket
  Dado que existe un ticket
  Cuando asigno a más de una persona como responsables
  Entonces todas quedan registradas como asignadas al ticket

Escenario: Un usuario se autoasigna un ticket
  Dado que existe un ticket en el que no estoy asignado
  Cuando me asigno a mí mismo el ticket
  Entonces quedo registrado como uno de los responsables
```

---

## Historia 8: Filtros de tickets

Como persona de la empresa quiero filtrar el listado de tickets por fecha, prioridad, responsable, proyecto y etiquetas, para encontrar rápidamente el trabajo relevante.

**RF de origen:** RF-12

```gherkin
Escenario: Filtrar tickets por proyecto
  Dado que existen tickets de varios proyectos
  Cuando filtro el listado por un proyecto específico
  Entonces solo se muestran los tickets de ese proyecto

Escenario: Filtrar tickets combinando varios criterios
  Dado que existen tickets con distintas prioridades y responsables
  Cuando aplico un filtro por prioridad y por responsable simultáneamente
  Entonces solo se muestran los tickets que cumplen ambos criterios
```

**Edge case (deducido):**

```gherkin
Escenario: Filtro sin resultados
  Dado que aplico una combinación de filtros
  Cuando ningún ticket cumple esos criterios
  Entonces el listado se muestra vacío
```

---

## Historia 9: Tablero Kanban con transición secuencial obligatoria

Como persona de la empresa quiero mover los tickets a través de un tablero con los estados "Por hacer", "En progreso", "Review" y "Terminado" en orden secuencial, para reflejar el avance real del trabajo.

**RF de origen:** RF-13

```gherkin
Escenario: Avanzar un ticket al siguiente estado
  Dado que un ticket está en "Por hacer"
  Cuando cambio su estado a "En progreso"
  Entonces el ticket queda en "En progreso"

Escenario: Completar el flujo hasta el final
  Dado que un ticket está en "Review"
  Cuando cambio su estado a "Terminado"
  Entonces el ticket queda en "Terminado"
```

**Edge cases / fallos (deducidos):**

```gherkin
Escenario: Intento de salto de columnas hacia adelante
  Dado que un ticket está en "Por hacer"
  Cuando intento cambiar su estado directamente a "Terminado"
  Entonces el sistema rechaza la transición

Escenario: Intento de retroceso de estado
  Dado que un ticket está en "Review"
  Cuando intento cambiar su estado a "Por hacer"
  Entonces el sistema rechaza la transición
```

---

## Historia 10: Resolución de conflictos de edición concurrente

Como persona de la empresa quiero que, si dos personas editan el mismo ticket a la vez, prevalezca la última escritura, para no bloquear el trabajo del equipo con avisos de conflicto.

**RF de origen:** RF-14

```gherkin
Escenario: Dos usuarios editan el mismo ticket simultáneamente
  Dado que dos usuarios abren el mismo ticket para editarlo
  Cuando ambos guardan sus cambios, uno después del otro
  Entonces prevalece la versión guardada en último lugar, sin bloqueo optimista ni aviso de conflicto
```

---

## Historia 11: Comentarios en tickets

Como persona de la empresa quiero añadir comentarios dentro de un ticket, para discutir detalles del trabajo con el equipo.

**RF de origen:** RF-15

```gherkin
Escenario: Añadir un comentario a un ticket
  Dado que estoy viendo un ticket
  Cuando escribo y envío un comentario
  Entonces el comentario queda visible en el hilo del ticket

Escenario: Ver el hilo de comentarios existente
  Dado que un ticket tiene varios comentarios previos
  Cuando abro el ticket
  Entonces veo todos los comentarios en orden cronológico
```

---

## Historia 12: Modo oscuro

Como persona de la empresa quiero alternar entre modo claro y modo oscuro, para adaptar la interfaz a mis condiciones de trabajo.

**RF de origen:** RF-16

```gherkin
Escenario: Cambiar a modo oscuro
  Dado que estoy usando la interfaz en modo claro
  Cuando activo el modo oscuro
  Entonces la interfaz cambia a la paleta de modo oscuro

Escenario: Cambiar a modo claro
  Dado que estoy usando la interfaz en modo oscuro
  Cuando activo el modo claro
  Entonces la interfaz cambia a la paleta de modo claro
```

---

## Fuera de alcance del MVP (excluido deliberadamente del backlog)

- Notificaciones por email (RF-18).
- Dashboard de métricas (RF-19).
