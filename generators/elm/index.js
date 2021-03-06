/* eslint-disable camelcase */
"use strict";
const Generator = require("yeoman-generator");
const chalk = require("chalk");
const yosay = require("yosay");
const mkdirp = require("mkdirp");
const path = require("path");

module.exports = class extends Generator {
  prompting() {
    // Have Yeoman greet the user.
    this.log(
      yosay(
        `Welcome to the splendid ${chalk.red(
          "generator-elm-webpack"
        )} generator!`
      )
    );

    const prompts = [
      {
        type: "confirm",
        name: "sass",
        message: "Would you like to enable SASS compilation?",
        default: false
      },
      {
        type: "confirm",
        name: "smacss",
        message: "Would you like to to scaffold a SMACSS template?",
        default: false,
        when: answers => answers.sass
      },
      {
        type: "confirm",
        name: "typescript",
        message: "Would you like to enable TypeScript compilation?",
        default: false
      },
      {
        type: "confirm",
        name: "spa",
        message:
          "Would you like to create a Single Page Application boilerplate?",
        default: false
      },
      {
        type: "confirm",
        name: "serviceWorker",
        message:
          "Would you like to enable to enable a serviceworker for offline caching?",
        default: false
      },
      {
        type: "confirm",
        name: "pwa",
        message: "Would you like to enable Progressive Web App boilerplate?",
        default: false
      },
      {
        type: "confirm",
        name: "compression",
        message: "Would you like to enable compressed assets for production?",
        default: false
      },
      {
        type: "confirm",
        name: "brotli",
        message: `Would you like to enable brotli for compression? (Requires Node >= 11.7.0, you are on ${process.versions.node})`,
        default: false,
        when: answers => answers.compression
      },
      {
        type: "confirm",
        name: "docker",
        message: "Add docker support?",
        default: false
      }
    ];

    return this.prompt(prompts).then(props => {
      // To access props later use this.props.someAnswer;
      this.props = props;
    });
  }

  writing() {
    if (this.options.path) {
      this.destinationRoot(this.options.path);
    }

    this._write_package_json();
    this._write_elm_json();
    this._copy_files();
  }

  _write_package_json() {
    // START PKG JSON
    // DEPENDENCIES
    let pkgJson = {
      devDependencies: {
        "@babel/core": "^7.7.7",
        "@babel/preset-env": "^7.7.7",
        "babel-loader": "^8.0.6",
        "clean-webpack-plugin": "^3.0.0",
        "copy-webpack-plugin": "^5.1.1",
        "css-loader": "^3.4.1",
        elm: "0.19.1-3",
        "elm-test": "0.19.1",
        "elm-analyse": "^0.16.5",
        "elm-hot-webpack-loader": "^1.1.6",
        "elm-webpack-loader": "^6.0.1",
        "html-loader": "^0.5.5",
        "html-webpack-plugin": "^3.2.0",
        "mini-css-extract-plugin": "^0.9.0",
        "optimize-css-assets-webpack-plugin": "^5.0.3",
        "style-loader": "^1.1.2",
        "uglifyjs-webpack-plugin": "^2.2.0",
        webpack: "^4.41.5",
        "webpack-cli": "^3.3.10",
        "webpack-dev-server": "^3.10.1",
        "webpack-merge": "^4.2.2"
      }
    };
    this.fs.extendJSON(this.destinationPath("package.json"), pkgJson);

    if (this.props.typescript) {
      let pkgJsonTS = {
        devDependencies: {
          "ts-loader": "^6.2.1",
          typescript: "^3.7.4"
        }
      };
      this.fs.extendJSON(this.destinationPath("package.json"), pkgJsonTS);
    }

    if (this.props.sass) {
      let pkgJsonSass = {
        devDependencies: {
          "node-sass": "^4.13.0",
          "sass-loader": "^8.0.0"
        }
      };
      this.fs.extendJSON(this.destinationPath("package.json"), pkgJsonSass);
    }

    if (this.props.serviceWorker || this.props.pwa) {
      let pkgJsonServiceWorker = {
        devDependencies: {
          "workbox-webpack-plugin": "^4.3.1"
        }
      };
      this.fs.extendJSON(
        this.destinationPath("package.json"),
        pkgJsonServiceWorker
      );
    }

    if (this.props.compression) {
      let pkgJsonCompression = {
        devDependencies: {
          "compression-webpack-plugin": "^3.0.0"
        }
      };
      this.fs.extendJSON(
        this.destinationPath("package.json"),
        pkgJsonCompression
      );
    }
    // END DEPENDENCIES

    // START SCRIPTS
    let pkgJsonScripts = {
      scripts: {
        dev: `webpack --config webpack.dev.js`,
        serve: `webpack-dev-server -d --config webpack.dev.js --open`,
        test: "elm-test",
        prod: `webpack --config webpack.prod.js`
      }
    };

    if (this.props.docker) {
      pkgJsonScripts.scripts[
        "docker-dev"
      ] = `webpack-dev-server -d --config webpack.docker.js --open`;
    }

    this.fs.extendJSON(this.destinationPath("package.json"), pkgJsonScripts);
    // END SCRIPTS

    // END PKG JSON
  }

  _write_elm_json() {
    // START ELM JSON
    let elmJson = {
      type: "application",
      "source-directories": ["src/elm"],
      "elm-version": "0.19.1",
      dependencies: {
        direct: {
          "elm/browser": "1.0.1",
          "elm/core": "1.0.2",
          "elm/html": "1.0.0"
        },
        indirect: {
          "elm/json": "1.1.3",
          "elm/time": "1.0.0",
          "elm/virtual-dom": "1.0.2"
        }
      },
      "test-dependencies": {
        direct: {
          "elm-explorations/test": "1.1.0"
        },
        indirect: {
          "elm/random": "1.0.0"
        }
      }
    };
    this.fs.extendJSON(this.destinationPath("elm.json"), elmJson);

    let extraElmJson = {
      dependencies: {
        indirect: {
          "elm/url": "1.0.0"
        }
      }
    };
    if (this.props.spa) {
      extraElmJson = {
        dependencies: {
          direct: {
            "elm/url": "1.0.0"
          }
        }
      };
    }

    this.fs.extendJSON(this.destinationPath("elm.json"), extraElmJson);
    // END ELM JSON
  }

  _copy_files() {
    // COPY FILES
    // GITIGNORE
    this.fs.copy(
      this.templatePath("gitignore.npmsucks"),
      this.destinationPath(".gitignore")
    );

    // TESTS
    this.fs.copy(
      this.templatePath("tests/Example.elm"),
      this.destinationPath("tests/Example.elm")
    );

    // INDEX HTML
    this.fs.copyTpl(
      this.templatePath("src/index.html"),
      this.destinationPath("src/index.html"),
      { pwa: this.props.pwa, serviceWorker: this.props.serviceWorker }
    );

    // MAIN ELM
    if (this.props.spa) {
      this.fs.copy(
        this.templatePath("src/elm/Main-SPA.elm"),
        this.destinationPath("src/elm/Main.elm")
      );
    } else {
      this.fs.copy(
        this.templatePath("src/elm/Main.elm"),
        this.destinationPath("src/elm/Main.elm")
      );
    }

    // INDEX JS
    if (this.props.typescript) {
      // TYPESCRIPT
      this.fs.copyTpl(
        this.templatePath("src/index.ts"),
        this.destinationPath("src/index.ts"),
        {
          sass: this.props.sass
        }
      );

      this.fs.copy(
        this.templatePath("tsconfig.json"),
        this.destinationPath("tsconfig.json")
      );
    } else {
      // NOT TYPESCRIPT
      this.fs.copyTpl(
        this.templatePath("src/index.js"),
        this.destinationPath("src/index.js"),
        { sass: this.props.sass }
      );
    }

    // STYLESHEETS
    if (this.props.sass) {
      // SASS
      if (this.props.smacss) {
        // SMACSS
        this.fs.copy(
          this.templatePath("src/assets/sass/styles-smacss.scss"),
          this.destinationPath("src/assets/sass/styles.scss")
        );
        this.fs.copy(
          this.templatePath("src/assets/sass/smacss/base.scss"),
          this.destinationPath("src/assets/sass/smacss/base.scss")
        );
        this.fs.copy(
          this.templatePath("src/assets/sass/smacss/layout.scss"),
          this.destinationPath("src/assets/sass/smacss/layout.scss")
        );
        this.fs.copy(
          this.templatePath("src/assets/sass/smacss/modules.scss"),
          this.destinationPath("src/assets/sass/smacss/modules.scss")
        );
        this.fs.copy(
          this.templatePath("src/assets/sass/smacss/state.scss"),
          this.destinationPath("src/assets/sass/smacss/state.scss")
        );
        this.fs.copy(
          this.templatePath("src/assets/sass/smacss/theme.scss"),
          this.destinationPath("src/assets/sass/smacss/theme.scss")
        );
      } else {
        // NOT SMACSS
        this.fs.copy(
          this.templatePath("src/assets/sass/styles.scss"),
          this.destinationPath("src/assets/sass/styles.scss")
        );
      }
    } else {
      // NOT SASS
      this.fs.copy(
        this.templatePath("src/assets/css/styles.css"),
        this.destinationPath("src/assets/css/styles.css")
      );
    }

    // WEBPACK FILES
    this.fs.copyTpl(
      this.templatePath("webpack.common.js"),
      this.destinationPath("webpack.common.js"),
      {
        typescript: this.props.typescript,
        sass: this.props.sass,
        pwa: this.props.pwa,
        serviceWorker: this.props.serviceWorker
      }
    );
    this.fs.copyTpl(
      this.templatePath("webpack.dev.js"),
      this.destinationPath("webpack.dev.js"),
      {
        sass: this.props.sass
      }
    );
    this.fs.copyTpl(
      this.templatePath("webpack.prod.js"),
      this.destinationPath("webpack.prod.js"),
      {
        sass: this.props.sass,
        pwa: this.props.pwa,
        serviceWorker: this.props.serviceWorker,
        compression: this.props.compression,
        brotli: this.props.brotli
      }
    );

    // STATIC FOLDER
    mkdirp.sync(path.join(this.destinationPath(), "static"));

    // PWA FILES
    if (this.props.pwa) {
      this.fs.copy(
        this.templatePath("static/manifest.json"),
        this.destinationPath("static/manifest.json")
      );
      this.fs.copy(
        this.templatePath("static/icons/icon-192x192.png"),
        this.destinationPath("static/icons/icon-192x192.png")
      );
      this.fs.copy(
        this.templatePath("static/icons/icon-512x512.png"),
        this.destinationPath("static/icons/icon-512x512.png")
      );
    }

    // README
    this.fs.copyTpl(
      this.templatePath("README.md"),
      this.destinationPath("README.md"),
      {
        typescript: this.props.typescript
      }
    );

    // DOCKER
    if (this.props.docker) {
      this.fs.copy(
        this.templatePath(".dockerignore"),
        this.destinationPath(".dockerignore")
      );

      this.fs.copy(
        this.templatePath("DockerfileDevelopment"),
        this.destinationPath("DockerfileDevelopment")
      );

      this.fs.copy(
        this.templatePath("DockerfileProduction"),
        this.destinationPath("DockerfileProduction")
      );

      this.fs.copy(
        this.templatePath("docker/nginx.conf"),
        this.destinationPath("docker/nginx.conf")
      );

      this.fs.copy(
        this.templatePath("webpack.docker.dev.js"),
        this.destinationPath("webpack.docker.dev.js")
      );
    }

    // END COPY FILES
  }

  install() {
    this.installDependencies({ npm: false, bower: false, yarn: true });
  }
};
