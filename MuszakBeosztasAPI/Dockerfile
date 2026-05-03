# Lépés 1: Build fázis az alkalmazás fordításához
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Project fájl másolása és függőségek visszaállítása
COPY ["MuszakBeosztasAPI.csproj", "./"]
RUN dotnet restore "./MuszakBeosztasAPI.csproj"

# Teljes forráskód másolása és buildelés
COPY . .
RUN dotnet build "MuszakBeosztasAPI.csproj" -c Release -o /app/build

# Lépés 2: Publish fázis optimalizált futtatható kód generálására
FROM build AS publish
RUN dotnet publish "MuszakBeosztasAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Lépés 3: Futtatási fázis (Runtime image), hogy kicsi maradjon a konténer
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Környezeti változók (A Google Credentialt mountolva kell majd átadni a Cloud Run-ban)
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "MuszakBeosztasAPI.dll"]
