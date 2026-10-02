using System.Text;

namespace RevQuest.FirstSteps;

internal static class Program
{
    private static readonly byte[] Gate =
    [
        0x52, 0x53, 0x5E, 0x44, 0x40, 0x45, 0x4C, 0x4C,
        0x50, 0x54, 0x42, 0x63, 0x4A, 0x57, 0x51, 0x3D
    ];

    private static readonly byte[] Prize =
    [
        0x11, 0x01, 0x13, 0x17, 0x12, 0x0D, 0x1A, 0x1E,
        0x10, 0x1C, 0x08, 0x31, 0x09, 0x05, 0x1F, 0x0F
    ];

    private static int Main()
    {
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("======================================");
        Console.WriteLine("   RevQuest · The First Little EXE");
        Console.WriteLine("======================================");
        Console.ResetColor();
        Console.WriteLine("A tiny offline reverse-engineering quest.");
        Console.Write("Enter the passphrase: ");

        string phrase = Console.ReadLine() ?? string.Empty;
        if (!CheckPhrase(phrase))
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("Not quite. Keep exploring the program!");
            Console.ResetColor();
            return 1;
        }

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"You found it! Flag: {RevealFlag()}");
        Console.ResetColor();
        return 0;
    }

    private static bool CheckPhrase(string phrase)
    {
        if (phrase.Length != Gate.Length)
            return false;

        for (int i = 0; i < phrase.Length; i++)
        {
            byte positionKey = (byte)(0x31 + i);
            byte transformed = (byte)(phrase[i] ^ positionKey);
            if (transformed != Gate[i])
                return false;
        }

        return true;
    }

    private static string RevealFlag()
    {
        byte[] decoded = new byte[Prize.Length];
        for (int i = 0; i < Prize.Length; i++)
        {
            byte positionKey = (byte)(0x63 + i);
            decoded[i] = (byte)(Prize[i] ^ positionKey);
        }

        return Encoding.ASCII.GetString(decoded);
    }
}
