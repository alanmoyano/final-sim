Estoy armando un trabajo práctico que debo presentar para un final de la materia Simulación. El enunciado es @Enunciado.md. La metodología de resolución tiene que ser la siguiente:

- Todos los datos que nos da el enunciado luego deben ser editables antes de correr la simulación (por ejemplo, poder cambiar la media de la distribución exponencial o la tasa de descarga)
- También se debe poder configurar la cantidad de líneas de simulación a realizar y sus condiciones iniciales
- La descarga de los tanques costeros a la refinería se debe hacer en serie (un tanque costero a la vez)
- La presentación de los resultados debe ser en una tabla al estilo excel, la cuál tendrá muchas columnas (el vector de estado).
- Haz una configuración que sea para poder ingresar la lista de números aleatorios a usar durante la simulación, estos seran desde 0 inclusive hasta 99 inclusive y se transformaran en decimales (por ejemplo 32 a 0.32 y así)

En esta primera iteración SOLO vas a armar la parte de configuraciones de la simulación y NO el vector de estado.

Vas a tomar inspiración de este proyecto https://github.com/BrisaDiaz/TP4_SIM, lee su código por si necesitas alguna pista.

Todo deberá ser desarrollado usando los componentes de shadcn/ui que ya he instalado. Siempre busca en internet cuando tengas duda sobre algún tópico

---

Vamos a armar la tabla con el vector de estado, por ahora no vamos a ejecutar ninguna simulación, primero nos aseguraremos que esté correcto esto.

- Recuerda revisar el repositorio de código que te pasé antes por si necesitas alguna ayuda.
- Vamos a hacer una tabla cuyos encabezados serán sticky, pudiendo siempre saber a qué se refieren los valores de abajo.
- Las primeras 3 columnas, también seran sticky, dado que estas tendran los datos principales para identificar un evento.
- Dado que esta tabla debe parecerse lo máximo posible a una hecha con excel, en varios casos se harán 'títulos' para algunas columnas. Te adjunto fotos tanto de como se ve un ejemplo en excel y otro ejemplo ya hecho tablas en el frontend.
- Por ahora, muestra siempre la tabla y genera algunos valores de ejemplo, estos seran usados unicamente para comprobar que la tabla se vea como quiero.

---

Vamos a implementar la lógica del trabajo práctico, lee el @Enunciado, también lee @Encabezados para entender un poco más sobre cada dato del vector de estados

- La lógica deberas armarla en archivos distintos, idealmente en la carpeta @services, para calcular los valores necesarios en la distribución exponencial usa la función presente en el archivo @distribuciones
- Investiga en internet sobre como se resuelven los problemas de este estilo, tienes como ejemplo el tp de https://github.com/BrisaDiaz/TP4_SIM, pero debes investigar más
- Yo debo explicar el funcionamiento luego, asique no agregues comentarios innecesarios al código y asegurate de escribirlo de la manera más sencilla posible
- No cometas errores ni produzcas alucinaciones
- Si no comprendes algo, preguntame directamente

Aclaraciones sobre el enunciado:

- Ten en cuenta la 0,5 hora en el tiempo de bombeo
- Para los números aleatorios necesarios, el frontend envía 2 listas, estas deberan ser usadas durante la ejecución en orden, cuando se te acaben los números, vuelve a empezar desde el primero, NO generes nuevos, reutiliza los dados
- Utiliza acumuladores sencillos para contar la cantidad de Tn descargadas y el tamaño máximo de cola
- Crea internamente los buques necesarios, especialmente para manejar el estado inicial de la simulación
- Asigna los números de buque y muestra esos datos en la tabla

Vas a analizar todo esto y formar un plan con pasos para poder resolver este problema.

Es importante saber que para la presentación, se harán 1000 horas. Pero igualmente debes aceptar todos los parametros que te envia el formulario.
Deberemos generar la lógica de la simulación, luego enviar estos datos para que se vean en la tabla y finalmente presentar en otra card abajo, las estadísticas pedidas (acumulador de Tn y tamaño máximo de cola)

Ahora: Investiga y entiende el problema y luego presenta tu plan de acción. NO implementes nada todavía.
