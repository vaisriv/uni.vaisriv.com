{
    pkgs,
    perSystem,
    inputs,
    system,
    ...
}:
perSystem.devshell.mkShell {
    name = "uni-notes website";
    motd = ''
        {141}uni-notes website{reset} devshell
        $(type -p menu &>/dev/null && menu)
    '';

    commands = [
        {
            name = "preview";
            help = "run quartz preview server";
            command =
                # bash
                ''
                    npm install
                    npx quartz build --serve
                '';
        }
    ];
    packages = with pkgs; [ nodejs_24 ];

    env = [];
}
