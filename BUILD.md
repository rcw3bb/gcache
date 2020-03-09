# Build

## Pre-requisite

* Java 8
* [IntelliJ 2017.3](https://download.jetbrains.com/idea/ideaIC-2017.3.7.exe)

## Install Gosu Plugin

1. **Open** your **IntelliJ 2017.3**.
2. Select **File-> Settings** menu.
3. Click **Plugins**.
4. Click the **Browse Repositories** button.
5. Type **OS Gosu**.
6. Click the **Install** button.
7. Click the **Restart IntellliJ IDEA** button.
8. Click the **OK** button.
9. Click the **Restart** button.

## Testing

Run the following command to test the application:

```
gradlew clean check
```

> The preceding command must be run from the location where you've cloned the repository.
>
> If you are running the test in IntelliJ's **Platform Test Runner** ensure that the **Java 8's tools.jar** is part of the **1.8 SDK's** classpath.

## Building

Run the following command to build the application:

```
gradlew build
```

> The preceding command must be run from the location where you've cloned the repository.

## Packaging

Run the following command to package the application:

```
gradlew jar
```

> The preceding command must be run from the location where you've cloned the repository.