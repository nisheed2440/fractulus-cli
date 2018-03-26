# Fractulus CLI
A command line interface for Fractulus

![CLI](/docs/images/cli-install.png "Installation")

# hbf new
The Fractulus CLI makes it easy to create an application that already works, right out of the box. It already follows [fractal](http://fractal.build/guide) best practices!

```bash
# Creates new app "awesome-application" under current working directory
> hbf new "Awesome Application"
# Alias
> hbf n "Awesome Application"
# Skip installation of node modules
> hbf n "Awesome Application" -s
# Help & Options
> hbf new --help
```

# hbf create-component
Generate components with a simple command. The CLI will also create simple test shells for them.

```bash
# Creates a component "hello-world" under "./src/app/components"
> hbf create-component "Hello World"
# Alias
> hbf cc "Hello World"
# Help & Options
> hbf cc --help
```

# hbf create-page
Generate pages with a simple command.

```bash
# Creates a page "homepage" under "./src/app/pages"
> hbf create-page "Homepage"
# Alias
> hbf cp "Homepage"
# Help & Options
> hbf cp --help
```

# hbf serve
Easily test your app locally while developing.

```bash
# Serve locally
> hbf serve
# Serve in production mode
> hbf serve -p
# Watch files
> hbf serve -w
# Generate source maps
> hbf serve -s
# Help & Options
> hbf serve --help
```

# hbf build
Compiles the application into an output directory. The build artifacts will be stored in the dist/ directory

```bash
# Build for deployment
> hbf build
# Build production
> hbf build -p
# Generate source maps
> hbf build -s
# Help & Options
> hbf build --help
```