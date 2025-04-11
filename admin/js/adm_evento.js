document.addEventListener('DOMContentLoaded', async () => {
    // Variable global para almacenar categorías
    let categorias = [];
    
    // Función para obtener las categorías
    const fetchCategorias = async () => {
        try {
            const response = await fetch('http://localhost:8080/project-AI/categoria');
            if (response.ok) {
                categorias = await response.json();
                return categorias;
            } else {
                console.error('Error al obtener categorías:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Error en la conexión:', error);
            return [];
        }
    };
    
    // Función para poblar selects de categoría
    const poblarSelectCategorias = (selectElement, categoriaSeleccionada = '') => {
        selectElement.innerHTML = '<option value="">Seleccione categoría</option>';
        categorias.forEach(cate => {
            const option = document.createElement('option');
            option.value = cate.catId;
            option.textContent = `${cate.catId} - ${cate.catNombre}`;
            if (cate.catId == categoriaSeleccionada) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
    };
    
    // Función para obtener nombre de categoría por ID
    const getNombreCategoria = (catId) => {
        const categoria = categorias.find(c => c.catId == catId);
        return categoria ? `${catId} - ${categoria.catNombre}` : `Categoría ${catId}`;
    };

    // Función para obtener y mostrar los datos de la base de datos
    const fetchEvento = async () => {
      try {
        // Primero cargamos las categorías si no están cargadas
        if (categorias.length === 0) {
            await fetchCategorias();
        }
        
        // Realizamos una petición GET a la API que devuelve todos los eventos
        const response = await fetch('http://localhost:8080/project-AI/eventoComu');
        if (response.ok) {
          const eventos = await response.json();
  
          // Seleccionamos el contenedor donde se van a mostrar los datos
          const listaEventos = document.getElementById('listaEventos');
          listaEventos.innerHTML = ''; // Limpiamos cualquier dato previo
  
          // Iteramos sobre los eventos y los agregamos al contenedor
          eventos.forEach(eve => {
            // Determinar la clase CSS según el estado
            let statusClass = '';
            switch(eve.eveComuEstado.toLowerCase()) {
              case 'activo':
                statusClass = 'status-active';
                break;
              case 'inactivo':
                statusClass = 'status-inactive';
                break;
              case 'cancelado':
                statusClass = 'status-cancelled';
                break;
              default:
                statusClass = 'status-active';
            }
            
            // Formatear fechas para mostrarlas mejor
            const fechaInicio = new Date(eve.eveComuFechaInicio).toLocaleString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            const fechaFin = new Date(eve.eveComuFechaFin).toLocaleString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            const fechaCreacion = new Date(eve.eveComuFechaCreacion || eve.eveComuFechaInicio).toLocaleDateString('es-ES');

            // Obtener nombre de categoría
            const nombreCategoria = getNombreCategoria(eve.eveComuCategoria);

            // Crear el elemento del evento
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
              <div class="event-header">
                  <h5 class="mb-0">${eve.eveComuTitulo}</h5>
                  <span class="event-status ${statusClass}">${eve.eveComuEstado}</span>
              </div>
              <div class="event-body">
                  <p class="text-muted">${eve.eveComuDescripcion}</p>
                  <div class="d-flex flex-wrap gap-2 mb-3">
                      <span class="badge badge-category"><i class="bi bi-tag-fill me-1"></i>${nombreCategoria}</span>
                      <span class="badge bg-light text-dark"><i class="bi bi-calendar-event me-1"></i>${fechaInicio}</span>
                      <span class="badge bg-light text-dark"><i class="bi bi-geo-alt-fill me-1"></i>${eve.eveComuUbicacion}</span>
                  </div>
                  <div class="d-flex align-items-center">
                      <i class="bi bi-link-45deg me-2"></i>
                      <a href="${eve.eveComuEnlace}" class="text-primary" target="_blank">${eve.eveComuEnlace}</a>
                  </div>
              </div>
              <div class="event-footer">
                  <small class="text-muted">Creado: ${fechaCreacion}</small>
                  <div>
                      <button class="btn-action btn-edit" data-id="${eve.eveComuId}" data-bs-toggle="modal" data-bs-target="#modalEditarEvento">
                          <i class="bi bi-pencil-fill"></i> Editar
                      </button>
                      <button class="btn-action btn-delete" data-id="${eve.eveComuId}" data-bs-toggle="modal" data-bs-target="#modalConfirmarEliminar">
                          <i class="bi bi-trash-fill"></i> Eliminar
                      </button>
                  </div>
              </div>
            `;
  
            listaEventos.appendChild(eventCard);
          });
  
          // Agregar evento a los botones de editar
          document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', (event) => {
              const id = event.currentTarget.getAttribute('data-id');
              cargarDatosParaEditar(id);
            });
          });
  
          // Agregar evento a los botones de eliminar
          document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (event) => {
              const id = event.currentTarget.getAttribute('data-id');
              configurarEliminacion(id);
            });
          });
        } else {
          console.error('Error al obtener los eventos:', response.status);
        }
      } catch (error) {
        console.error('Error en la conexión:', error);
      }
    };
  
    // Función para cargar datos en el modal de edición
    const cargarDatosParaEditar = async (id) => {
      try {
        const response = await fetch(`http://localhost:8080/project-AI/eventoComu/${id}`);
        if (response.ok) {
          const evento = await response.json();
          
          // Poblar el select de categorías con la categoría actual seleccionada
          const catSelect = document.getElementById('editarCategoria');
          poblarSelectCategorias(catSelect, evento.eveComuCategoria);

          // Rellenar el modal con los datos del evento
          document.getElementById('editarTituloEvento').value = evento.eveComuTitulo;
          document.getElementById('editarDescripcion').value = evento.eveComuDescripcion;
          
          // Formatear fechas para el input datetime-local
          const fechaInicio = new Date(evento.eveComuFechaInicio);
          const fechaFin = new Date(evento.eveComuFechaFin);
          
          document.getElementById('editarFechaInicio').value = fechaInicio.toISOString().slice(0, 16);
          document.getElementById('editarFechaFin').value = fechaFin.toISOString().slice(0, 16);
          
          document.getElementById('editarUbicacion').value = evento.eveComuUbicacion;
          document.getElementById('editarEnlace').value = evento.eveComuEnlace;
          document.getElementById('editarEstado').value = evento.eveComuEstado.toLowerCase();
          
          // Guardar el ID en el formulario para usarlo al guardar
          document.getElementById('formEditarEvento').dataset.id = id;
        } else {
          console.error('Error al obtener los datos del evento:', await response.text());
          alert('Error al cargar los datos para editar.');
        }
      } catch (error) {
        console.error('Error en la conexión:', error);
        alert('Error en la conexión al servidor.');
      }
    };
    
    // Configurar el evento de eliminación
    const configurarEliminacion = (id) => {
      const modal = document.getElementById('modalConfirmarEliminar');
      const btnConfirmarEliminar = modal.querySelector('.btn-danger');
      
      // Remover cualquier evento previo
      btnConfirmarEliminar.replaceWith(btnConfirmarEliminar.cloneNode(true));
      const newBtn = modal.querySelector('.btn-danger');
      
      // Agregar nuevo evento
      newBtn.addEventListener('click', async () => {
        try {
          const response = await fetch(`http://localhost:8080/project-AI/eventoComuE/${id}`, {
            method: 'DELETE',
          });
    
          if (response.ok) {
            alert('Evento eliminado correctamente');
            // Cerrar el modal
            const modalInstance = bootstrap.Modal.getInstance(modal);
            modalInstance.hide();
            // Recargar los eventos
            await fetchEvento();
          } else {
            console.error('Error al eliminar el evento:', await response.text());
            alert('Error al eliminar el evento.');
          }
        } catch (error) {
          console.error('Error en la conexión al eliminar:', error);
          alert('Error al eliminar el evento.');
        }
      });
    };
    
    // Configurar el envío del formulario de edición
    document.getElementById('formEditarEvento').addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const id = event.target.dataset.id;
      const titulo = document.getElementById('editarTituloEvento').value;
      const descripcion = document.getElementById('editarDescripcion').value;
      const categoria = document.getElementById('editarCategoria').value;
      const fechaInicio = document.getElementById('editarFechaInicio').value;
      const fechaFin = document.getElementById('editarFechaFin').value;
      const ubicacion = document.getElementById('editarUbicacion').value;
      const enlace = document.getElementById('editarEnlace').value;
      const estado = document.getElementById('editarEstado').value;
      
      try {
        const response = await fetch(`http://localhost:8080/project-AI/eventoComuA`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            eveComuId: id,
            eveComuTitulo: titulo,
            eveComuDescripcion: descripcion,
            eveComuFechaInicio: fechaInicio,
            eveComuFechaFin: fechaFin,
            eveComuUbicacion: ubicacion,
            eveComuEnlace: enlace,
            eveComuEstado: estado,
            eveComuCategoria: categoria
          })
        });
    
        if (response.ok) {
          alert('Evento actualizado correctamente');
          // Cerrar el modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarEvento'));
          modal.hide();
          // Recargar los eventos
          await fetchEvento();
        } else {
          console.error('Error al actualizar el evento:', await response.text());
          alert('Error al actualizar el evento.');
        }
      } catch (error) {
        console.error('Error en la conexión al actualizar:', error);
        alert('Error al actualizar el evento.');
      }
    });

    // Cargar categorías y luego eventos al iniciar
    await fetchCategorias();
    await fetchEvento();
});