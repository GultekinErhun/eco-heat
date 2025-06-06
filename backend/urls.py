from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('sensors.urls')),
    path('api-auth/', include('rest_framework.urls')),
    path('', include('schedules.urls')),  # Schedules uygulamasının URL'lerini ekleyin

]

