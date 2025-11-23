using UnityEngine;

public class GoalArea : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        goal = false;
    }

    // Update is called once per frame
    private void OnTriggerEnter(Collider col)
    {
        if (col.gameObject.tag == "Player")
        {
            goal = true;
        }
    }
}
