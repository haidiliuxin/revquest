# EXE Boss challenge

`RevQuest.FirstSteps.exe` is a self-authored, offline Windows x64 teaching sample used by the final learning quest.

- It reads one line from standard input and writes status text to standard output.
- It makes no network requests and does not read or write files.
- It targets the .NET 8 runtime. If it cannot start, install the [Microsoft .NET 8 Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/8.0) or inspect it directly with ILSpy.
- It is framework-dependent and single-file published. No application data files are needed.
- The student workflow is: inspect with ILSpy, recover the passphrase, run the EXE in a terminal, and submit the flag printed by the program.

The source project is in `RevQuest.FirstSteps/`. To rebuild the sample on Windows with the .NET 8 SDK:

```powershell
dotnet publish .\RevQuest.FirstSteps\RevQuest.FirstSteps.csproj -c Release
Copy-Item .\RevQuest.FirstSteps\bin\Release\net8.0\win-x64\publish\RevQuest.FirstSteps.exe .\RevQuest.FirstSteps.exe -Force
```

This challenge is for authorized CTF education and offline practice only.
