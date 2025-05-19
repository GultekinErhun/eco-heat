from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('sensors.urls')),
    path('scheduling/', include('scheduling.urls')),
    path('api-auth/', include('rest_framework.urls')),
]