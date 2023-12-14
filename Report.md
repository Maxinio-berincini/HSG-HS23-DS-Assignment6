Assignment 6
---------------------

# Team Members

- Felix Kappeler
- Leon Luca Klaus Muscat
- Max Beringer

# GitHub link to your (forked) repository

> https://github.com/Maxinio-berincini/HSG-HS23-DS-Assignment6

# Task 1

1. WebIDs of the group members

Ans:
> Felix Kappeler: https://solid.interactions.ics.unisg.ch/FeKap/profile/card#me
>
> Leon Luca Klaus Muscat: https://solid.interactions.ics.unisg.ch/LeMus/profile/card#me
>
> Max Beringer: https://solid.interactions.ics.unisg.ch/MaBer/profile/card#me


2. Group profile

Ans:

> DefinitlyNotAVirus:
> https://solid.interactions.ics.unisg.ch/MaBer/bcs-ds-2023-DefinitelyNotAVirus-group




# Task 2

1. What command did you perform to get the group name from the WebId?

Ans: 

> The Idea was to get the query to look for any group, that has a member with the WebId of the queried profile. 

```bash
comunica-sparql https://solid.interactions.ics.unisg.ch/MaBer/profile/card#me -l debug 'SELECT ?group WHERE { ?group <http://xmlns.com/foaf/0.1/member> <https://solid.interactions.ics.unisg.ch/MaBer/profile/card#me>. }'
```


2. Which command did you perform to get the group members from the WebId?

Ans:

> The Idea was to get the query to look for any group, that has a member with the WebId of the queried profile.
> And then to get every distinct member of that group and their name.

```bash
comunica-sparql-link-traversal https://solid.interactions.ics.unisg.ch/FeKap/profile/card#me  'SELECT DISTINCT ?name WHERE { ?group <http://xmlns.com/foaf/0.1/member> <https://solid.interactions.ics.unisg.ch/FeKap/profile/card#me>. ?group <http://xmlns.com/foaf/0.1/member> ?member. ?member <http://xmlns.com/foaf/0.1/name> ?name. }'
```

>output:
> 
> [
{"name":"\"Felix Kappeler\""},
{"name":"\"Max Beringer\""},
{"name":"\"Leon Luca Klaus Muscat\""}
]





3. Which command did you performed to get the group members from the WebId without link traversal? Which result did you get? Is it correct?

Ans:


> We reused the same query as in the previous question, but without the link traversal, because again we want the names of all the members of a team that the starting member is a part of.
```bash
comunica-sparql https://solid.interactions.ics.unisg.ch/MaBer/profile/card#me  'SELECT DISTINCT  ?name WHERE { ?group <http://xmlns.com/foaf/0.1/member> <https://solid.interactions.ics.unisg.ch/MaBer/profile/card#me>. ?group <http://xmlns.com/foaf/0.1/member> ?member. ?member <http://xmlns.com/foaf/0.1/name> ?name. }'
```

>output:
> 
>
>[
{"name":"\"Max Beringer\""}
]

> The result is not correct, as it shows only one member of the group, instead of all three.
>
> This is because the query does not follow the links to the other members of the group.
> 
> If the starting point of the query were the group profile, the query would return all three members of the group.
